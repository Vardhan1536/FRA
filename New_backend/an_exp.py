import pandas as pd
import geopandas as gpd
from pathlib import Path
import json
from typing import List, Dict, Any

DATA_DIR = Path("data")  # Adjust if different

# Global mutable stores
GLOBAL_APPLICATIONS: List[Dict[str, Any]] = []
GLOBAL_VILLAGES: Dict[str, Dict[str, Any]] = {}

def initialize_demo_data(target_district: str = "Mandla", target_block_for_sdlc: str = "Mandla") -> None:
    """
    Demo data loader for updated hierarchy (pyramid: 4 SDLC records in Block 1 → +4 DLC records in Block 2 = 8 total):
    - Structure: 2 Blocks > variable GPs (as needed) > variable Villages per GP > each Village has 1 Applicant.
    - Total: 8 villages, 8 applicants in GLOBAL_APPLICATIONS if data allows.
    - Visibility:
      - GS (per GP): records (filter by gp_name).
      - SDLC (Block 1): 4 records (filter by block_id and gramasabha=="Approved").
      - DLC: All 8 records.
    """
    # Load all datasets
    beneficiaries_df = pd.read_csv(DATA_DIR / "mock_fra_beneficiaries_mandla.csv")
    titles_df = pd.read_csv(DATA_DIR / "mock_fra_titles_mandla.csv")
    assets_df = pd.read_csv(DATA_DIR / "mock_detailed_asset_inventory_mandla.csv")
    admin_df = pd.read_csv(DATA_DIR / "mandla_consolidated_hierarchy.csv")
    vulnerability_df = pd.read_csv(DATA_DIR / "mock_vulnerability_assessment_mandla.csv")
    land_stats_df = pd.read_csv(DATA_DIR / "mandla_village_landcover.csv")

    
    # Load GeoJSONs
    ifr_gdf = gpd.read_file(DATA_DIR / "mock_fra_ifr_boundaries_mandla.geojson")
    cr_gdf = gpd.read_file(DATA_DIR / "mock_fra_cr_boundaries_mandla.geojson")
    cfr_gdf = gpd.read_file(DATA_DIR / "mock_fra_cfr_boundaries_mandla.geojson")
    
    gdfs = {"IFR": ifr_gdf, "CR": cr_gdf, "CFR": cfr_gdf}
    
    # Clear globals
    GLOBAL_APPLICATIONS.clear()
    GLOBAL_VILLAGES.clear()
    
    target_per_block = 4
    
    # Step 1: SDLC Block 1 - 4 records from GPs (variable villages each)
    block1_name = target_block_for_sdlc
    block1_gps = _get_gps_in_block(admin_df, block1_name)
    added_block1 = 0
    for gp_name in block1_gps:
        if added_block1 >= target_per_block:
            break
        gp_id = admin_df[admin_df["gp_name"] == gp_name]["map_gp_id"].iloc[0]
        villages = _get_villages_in_gp(admin_df, gp_name)
        for vil_idx in range(len(villages)):
            if added_block1 >= target_per_block:
                break
            village_id = villages[vil_idx]
            _add_village_to_global(village_id, admin_df, land_stats_df, gp_name=gp_name, block_name=block1_name)
            apps_before = len(GLOBAL_APPLICATIONS)
            _add_applications_to_global(1, village_id, beneficiaries_df, titles_df, assets_df, vulnerability_df, gdfs, 
                                       statuses={"gramasabha": "Approved", "sdlc": None, "dlc": None})
            added_block1 += len(GLOBAL_APPLICATIONS) - apps_before
    
    # Step 2: DLC Block 2 - +4 records from GPs (variable villages each, sdlc="Eligible")
    other_blocks = [b for b in admin_df[admin_df["district_name"] == target_district]["block_name"].unique() if b != block1_name]
    if other_blocks:
        block2_name = other_blocks[0]
    else:
        block2_name = block1_name  # Fallback to same if no other
    block2_gps = _get_gps_in_block(admin_df, block2_name)
    added_block2 = 0
    for gp_name in block2_gps:
        if added_block2 >= target_per_block:
            break
        gp_id = admin_df[admin_df["gp_name"] == gp_name]["map_gp_id"].iloc[0]
        villages = _get_villages_in_gp(admin_df, gp_name)
        for vil_idx in range(len(villages)):
            if added_block2 >= target_per_block:
                break
            village_id = villages[vil_idx]
            _add_village_to_global(village_id, admin_df, land_stats_df, gp_name=gp_name, block_name=block2_name)
            apps_before = len(GLOBAL_APPLICATIONS)
            _add_applications_to_global(1, village_id, beneficiaries_df, titles_df, assets_df, vulnerability_df, gdfs, 
                                       statuses={"gramasabha": "Approved", "sdlc": "Eligible", "dlc": None})
            added_block2 += len(GLOBAL_APPLICATIONS) - apps_before
    
    print(f"Demo data initialized: {len(GLOBAL_APPLICATIONS)} total applications across DLC for district '{target_district}'.")
    print(f"SDLC focus block: '{target_block_for_sdlc}'. Villages loaded: {list(GLOBAL_VILLAGES.keys())}")

def _get_gps_in_block(admin_df: pd.DataFrame, block_name: str) -> List[str]:
    """Get unique GP names in a block."""
    gps = admin_df[admin_df["block_name"] == block_name]["gp_name"].unique().tolist()
    return gps

def _get_villages_in_gp(admin_df: pd.DataFrame, gp_name: str) -> List[str]:
    """Get unique village_ids in a GP."""
    villages = admin_df[admin_df["gp_name"] == gp_name]["Map_Id"].unique().tolist()
    return villages

def _add_village_to_global(village_id: str, admin_df: pd.DataFrame, land_stats_df: pd.DataFrame, 
                          gp_name: str = None, block_name: str = None) -> None:
    """Helper: Add village admin + land_stats to GLOBAL_VILLAGES, with optional overrides."""
    if village_id in GLOBAL_VILLAGES:
        return
    # Lookup admin info
    admin_row = admin_df[admin_df["Map_Id"] == village_id]
    if admin_row.empty:
        return  # Skip if no real data
    admin_info = admin_row.iloc[0].to_dict()
    if "Map_Id" in admin_info:
        admin_info["village_id"] = admin_info.pop("Map_Id")
    if "Block_map_id" in admin_info:
        admin_info["block_map_id"] = admin_info.pop("block_map_id")
    if "map_gp_id" in admin_info:
        admin_info["gp_id"] = admin_info.pop("map_gp_id")
    else:
        admin_info["gp_id"] = None
    
    # Land stats lookup
    land_row = land_stats_df[land_stats_df["Map_Id"] == village_id]
    if land_row.empty:
        land_stats = {}
    else:
        land_stats = land_row.iloc[0].to_dict()
    
    GLOBAL_VILLAGES[village_id] = {
        **{k: v for k, v in admin_info.items() if k not in ["village_id"]},
        "gp_id": admin_info.get("gp_id"),
        "block_id": admin_info.get("block_map_id"),
        "land_stats": {k: float(v) if isinstance(v, (int, float)) else v for k, v in land_stats.items()}
    }

def _add_applications_to_global(count: int, village_id: str, beneficiaries_df: pd.DataFrame, titles_df: pd.DataFrame, 
                               assets_df: pd.DataFrame, vulnerability_df: pd.DataFrame, gdfs: Dict[str, gpd.GeoDataFrame], 
                               statuses: Dict[str, Any]) -> None:
    """Helper: Add up to 'count' (typically 1) applicant records to GLOBAL_APPLICATIONS from village, with given statuses."""
    village_bens = beneficiaries_df[beneficiaries_df["village_id"] == village_id].head(count)
    for idx in range(len(village_bens)):
        ben_row = village_bens.iloc[idx]
        beneficiary_id = ben_row["beneficiary_id"]
        if any(app['beneficiary_id'] == beneficiary_id for app in GLOBAL_APPLICATIONS):
            continue
        
        # Matching title
        matching_titles = titles_df[titles_df["beneficiary_id"] == beneficiary_id]
        if matching_titles.empty:
            continue
        title_row = matching_titles.iloc[0]
        title_id = title_row["title_id"]
        
        # Build personal_info
        personal_info = {
            "first_name": ben_row.get("first_name"),
            "last_name": ben_row.get("last_name"),
            "gender": ben_row.get("gender"),
            "tribal_community": ben_row.get("tribal_community"),
            "aadhaar": ben_row.get("aadhaar_number"),
            "income": float(ben_row.get("annual_income")) if "annual_income" in ben_row else None
        }
        
        # Title info with polygon
        claim_type = title_row.get("right_type", "CR")
        gdf = gdfs.get(claim_type, gdfs["CR"])
        subset = gdf[(gdf["beneficiary_id"] == beneficiary_id) & (gdf["title_id"] == title_id)]
        polygon_coords = []
        if not subset.empty:
            geom = subset.iloc[0].geometry
            if hasattr(geom, 'geom_type') and geom.geom_type == "Polygon":
                polygon_coords = [list(geom.exterior.coords)]
        
        title_info = {
            "right_type": claim_type,
            "status": title_row.get("status"),
            "claim_area_hectares": float(title_row.get("area_hectares")) if "area_hectares" in title_row else None,
            "polygon_coordinates": polygon_coords
        }
        
        # Admin info from global village
        village_data = GLOBAL_VILLAGES.get(village_id, {})
        admin_info = {
            "village_id": village_id,
            "village": village_data.get("village_name"),
            "gp": village_data.get("gp_name"),
            "block": village_data.get("block_name"),
            "district": village_data.get("district"),
            "state": village_data.get("state"),
            "forest_area_hectares": float(village_data.get("forest_area_hectares")) if "forest_area_hectares" in village_data else None,
            "block_id": village_data.get("block_id"),
            "gp_id": village_data.get("gp_id")
        }
        
        # Asset summary
        subset_assets = assets_df[(assets_df["beneficiary_id"] == beneficiary_id) & (assets_df["title_id"] == title_id)]
        asset_summary = {
            "total_area_hectares": float(subset_assets["area_hectares"].sum()) if not subset_assets.empty else 0.0,
            "asset_types": subset_assets["asset_type"].unique().tolist() if not subset_assets.empty else [],
            "assets_count": len(subset_assets) if not subset_assets.empty else 0
        }
        
        # Vulnerability
        vuln_row = vulnerability_df[vulnerability_df["beneficiary_id"] == beneficiary_id]
        vulnerability = {}
        if not vuln_row.empty:
            vuln_info = vuln_row.iloc[0].to_dict()
            vulnerability = {
                "score": float(vuln_info.get("vulnerability_score")),
                "category": vuln_info.get("category")
            }
        
        # Statuses from param
        applicant_record = {
            "beneficiary_id": beneficiary_id,
            "title_id": title_id,
            "personal_info": personal_info,
            "title_info": title_info,
            "admin_info": admin_info,
            "asset_summary": asset_summary,
            "vulnerability": vulnerability,
            "statuses": {
                "gramasabha": statuses.get("gramasabha", "Pending"),
                "sdlc": statuses.get("sdlc", None),
                "dlc": statuses.get("dlc", None)
            }
        }
        
        GLOBAL_APPLICATIONS.append(applicant_record)


# if __name__ == "__main__":
#     # Run the initialization
#     initialize_demo_data()

#     # Print details of global dictionaries
#     # print("\n=== GLOBAL_VILLAGES ===")
#     # print(json.dumps(GLOBAL_VILLAGES, indent=2, default=str))

#     print("\n=== GLOBAL_APPLICATIONS ===")
#     print(json.dumps(GLOBAL_APPLICATIONS, indent=2, default=str))