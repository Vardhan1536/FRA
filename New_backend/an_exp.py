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
    - Structure: 2 Blocks > each with 2 GPs > each GP has 2 Villages > each Village has 1 Applicant.
    - Total: 8 villages, 8 applicants in GLOBAL_APPLICATIONS.
    - Visibility:
      - GS (per GP): 2 records (filter by gp_name).
      - SDLC (Block 1): 4 records (filter by block_id="BLK_000001" and gramasabha=="Approved").
      - DLC: All 8 records.
    - Forces exactly 4 apps per block with fallbacks.
    """
    # Load all datasets
    beneficiaries_df = pd.read_csv(DATA_DIR / "mock_fra_beneficiaries_mandla.csv")
    titles_df = pd.read_csv(DATA_DIR / "mock_fra_titles_mandla.csv")
    assets_df = pd.read_csv(DATA_DIR / "mock_detailed_asset_inventory_mandla.csv")
    admin_df = pd.read_csv(DATA_DIR / "mock_administrative_hierarchy_mandla.csv")
    vulnerability_df = pd.read_csv(DATA_DIR / "mock_vulnerability_assessment_mandla.csv")
    land_stats_df = pd.read_csv(DATA_DIR / "landcover_stats_mandla_villages.csv")
    
    # Load GeoJSONs
    ifr_gdf = gpd.read_file(DATA_DIR / "mock_fra_ifr_boundaries_mandla.geojson")
    cr_gdf = gpd.read_file(DATA_DIR / "mock_fra_cr_boundaries_mandla.geojson")
    cfr_gdf = gpd.read_file(DATA_DIR / "mock_fra_cfr_boundaries_mandla.geojson")
    
    gdfs = {"IFR": ifr_gdf, "CR": cr_gdf, "CFR": cfr_gdf}
    
    # Clear globals
    GLOBAL_APPLICATIONS.clear()
    GLOBAL_VILLAGES.clear()
    
    # Step 1: SDLC Block 1 - Force exactly 4 records from 2 GPs (each with 2 villages, 1 app each)
    block1_name = target_block_for_sdlc
    block1_id = "BLK_000001"
    block1_gps = _get_gps_in_block(admin_df, block1_name)
    gp_counter = 1
    for gp_idx in range(2):  # Force 2 GPs
        gp_name = block1_gps[gp_idx] if gp_idx < len(block1_gps) else f"GP_{block1_name}_{gp_idx+1}_fallback"
        gp_id = admin_df[admin_df["gp_name"] == gp_name]["gp_id"].iloc[0] if not admin_df[admin_df["gp_name"] == gp_name].empty else f"{gp_counter:04d}"
        gp_counter += 1
        villages = _get_villages_in_gp(admin_df, gp_name)
        for vil_idx in range(2):  # Force 2 villages
            village_id = villages[vil_idx] if vil_idx < len(villages) else f"VIL_{len(GLOBAL_VILLAGES)+1:06d}_fallback"
            _add_village_to_global(village_id, admin_df, land_stats_df, gp_name=gp_name, block_name=block1_name, force_block_id=block1_id)
            # Add 1 app per village; all Approved for SDLC visibility
            _add_applications_to_global(1, village_id, beneficiaries_df, titles_df, assets_df, vulnerability_df, gdfs, 
                                       statuses={"gramasabha": "Approved", "sdlc": None, "dlc": None})
    
    # Step 2: DLC Block 2 - Force exactly +4 records from 2 GPs (same structure, sdlc="Eligible")
    other_blocks = [b for b in admin_df[admin_df["district"] == target_district]["block_name"].unique() if b != block1_name]
    block2_name = other_blocks[0] if other_blocks else f"{block1_name}_fallback"
    block2_id = "BLK_000002"
    block2_gps = _get_gps_in_block(admin_df, block2_name)
    for gp_idx in range(2):  # Force 2 GPs
        gp_name = block2_gps[gp_idx] if gp_idx < len(block2_gps) else f"GP_{block2_name}_{gp_idx+1}_fallback"
        gp_id = admin_df[admin_df["gp_name"] == gp_name]["gp_id"].iloc[0] if not admin_df[admin_df["gp_name"] == gp_name].empty else f"{gp_counter:04d}"
        gp_counter += 1
        villages = _get_villages_in_gp(admin_df, gp_name)
        for vil_idx in range(2):  # Force 2 villages
            village_id = villages[vil_idx] if vil_idx < len(villages) else f"VIL_{len(GLOBAL_VILLAGES)+1:06d}_fallback"
            if admin_df[admin_df["village_id"] == village_id.replace("_fallback", "")].empty:
                village_id = f"VIL_00000{(len(GLOBAL_VILLAGES) + 1):03d}_fallback"
            _add_village_to_global(village_id, admin_df, land_stats_df, gp_name=gp_name, block_name=block2_name, force_block_id=block2_id)
            # Add 1 app per village
            _add_applications_to_global(1, village_id, beneficiaries_df, titles_df, assets_df, vulnerability_df, gdfs, 
                                       statuses={"gramasabha": "Approved", "sdlc": "Eligible", "dlc": None})
    
    print(f"Demo data initialized: {len(GLOBAL_APPLICATIONS)} total applications (8 villages) across DLC for district '{target_district}'.")
    print(f"SDLC focus block: '{target_block_for_sdlc}' (4 records visible). Villages loaded: {list(GLOBAL_VILLAGES.keys())}")

def _get_gps_in_block(admin_df: pd.DataFrame, block_name: str) -> List[str]:
    """Get unique GP names in a block (force exactly 2 with fallback)."""
    gps = admin_df[admin_df["block_name"] == block_name]["gp_name"].unique().tolist()
    while len(gps) < 2:
        gps.append(f"{gps[0] if gps else 'GP_Default'}_alt_{len(gps)}")
    return gps[:2]

def _get_villages_in_gp(admin_df: pd.DataFrame, gp_name: str) -> List[str]:
    """Get unique village_ids in a GP (force exactly 2 with fallback)."""
    villages = admin_df[admin_df["gp_name"] == gp_name]["village_id"].unique().tolist()
    while len(villages) < 2:
        villages.append(f"{villages[0] if villages else 'VIL_Default'}_alt_{len(villages)}")
    return villages[:2]

def _add_village_to_global(village_id: str, admin_df: pd.DataFrame, land_stats_df: pd.DataFrame, 
                          gp_name: str = None, block_name: str = None, force_block_id: str = None) -> None:
    """Helper: Add village admin + land_stats to GLOBAL_VILLAGES, with optional overrides and forced block_id."""
    # Lookup or create admin info
    orig_village_id = village_id.replace("_alt_", "").replace("_fallback", "")
    admin_row = admin_df[admin_df["village_id"] == orig_village_id]
    if not admin_row.empty:
        admin_info = admin_row.iloc[0].to_dict()
    else:
        # Fallback dummy
        admin_info = {
            "village_name": f"Village_{orig_village_id}",
            "gp_name": gp_name or "GP_Default",
            "block_name": block_name or "Block_Default",
            "district": "Mandla",
            "state": "Madhya Pradesh",
            "forest_area_hectares": 100.0 + len(GLOBAL_VILLAGES) * 10,
            "gp_id": f"{len(GLOBAL_VILLAGES) + 1:04d}",
            "block_id": force_block_id or f"BLK_{block_name[:3]}001" if block_name else "BLK_000001"
        }
    
    # Force block_id if provided
    if force_block_id:
        admin_info["block_id"] = force_block_id
    
    # Land stats lookup or dummy
    land_row = land_stats_df[land_stats_df["village_id"] == orig_village_id]
    land_stats = land_row.iloc[0].to_dict() if not land_row.empty else {
        "Total_Area_sq_km": 50.0 + len(GLOBAL_VILLAGES) * 5,
        "Forest_sq_km": 30.0,
        "Water_sq_km": 2.0,
    }
    
    GLOBAL_VILLAGES[village_id] = {
        **{k: v for k, v in admin_info.items() if k not in ["village_id"]},
        "gp_id": admin_info.get("gp_id", f"{len(GLOBAL_VILLAGES) + 1:04d}"),
        "block_id": admin_info.get("block_id"),
        "land_stats": {k: float(v) if isinstance(v, (int, float)) else v for k, v in land_stats.items()}
    }

def _add_applications_to_global(count: int, village_id: str, beneficiaries_df: pd.DataFrame, titles_df: pd.DataFrame, 
                               assets_df: pd.DataFrame, vulnerability_df: pd.DataFrame, gdfs: Dict[str, gpd.GeoDataFrame], 
                               statuses: Dict[str, Any]) -> None:
    """Helper: Add 'count' (typically 1) applicant records to GLOBAL_APPLICATIONS from village, with given statuses."""
    for _ in range(count):  # Ensure exactly 'count' apps
        # Get or fallback beneficiary for this village
        orig_village_id = village_id.replace("_alt_", "").replace("_fallback", "")
        village_bens = beneficiaries_df[beneficiaries_df["village_id"] == orig_village_id].head(1)
        if village_bens.empty:
            # Fallback: Create dummy ben row
            ben_row = pd.Series({
                "beneficiary_id": f"FRA_{len(GLOBAL_APPLICATIONS) + 1:08d}",
                "first_name": f"Applicant_{len(GLOBAL_APPLICATIONS) + 1}",
                "last_name": "Demo",
                "gender": "Male" if (len(GLOBAL_APPLICATIONS) % 2 == 0) else "Female",
                "tribal_community": "Baiga",
                "aadhaar_number": f"AAD_{len(GLOBAL_APPLICATIONS) + 1:04d}0000",
                "annual_income": 40000 + (len(GLOBAL_APPLICATIONS) + 1) * 1000,
                "village_id": village_id
            })
        else:
            ben_row = village_bens.iloc[0]
        
        beneficiary_id = ben_row["beneficiary_id"]
        
        # Matching title or fallback
        matching_titles = titles_df[titles_df["beneficiary_id"] == beneficiary_id]
        if matching_titles.empty:
            title_row = pd.Series({
                "title_id": f"FRA_TITLE_{len(GLOBAL_APPLICATIONS) + 1:08d}",
                "right_type": "CR",
                "status": "Approved",
                "area_hectares": 1.5 + (len(GLOBAL_APPLICATIONS) + 1) * 0.1,
                "beneficiary_id": beneficiary_id
            })
        else:
            title_row = matching_titles.iloc[0]
        title_id = title_row["title_id"]
        
        # Build personal_info
        personal_info = {
            "first_name": ben_row.get("first_name", f"Applicant_{len(GLOBAL_APPLICATIONS) + 1}"),
            "last_name": ben_row.get("last_name", "Demo"),
            "gender": ben_row.get("gender", "Male"),
            "tribal_community": ben_row.get("tribal_community", "Baiga"),
            "aadhaar": ben_row.get("aadhaar_number", f"AAD_{len(GLOBAL_APPLICATIONS) + 1:04d}0000"),
            "income": float(ben_row.get("annual_income", 40000))
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
            "status": title_row.get("status", "Approved"),
            "claim_area_hectares": float(title_row.get("area_hectares", 1.5)),
            "polygon_coordinates": polygon_coords or [[
                [80.54 + len(GLOBAL_APPLICATIONS)*0.001, 22.79 + len(GLOBAL_APPLICATIONS)*0.001],
                [80.541 + len(GLOBAL_APPLICATIONS)*0.001, 22.791 + len(GLOBAL_APPLICATIONS)*0.001],
                [80.540 + len(GLOBAL_APPLICATIONS)*0.001, 22.790 + len(GLOBAL_APPLICATIONS)*0.001],
                [80.54 + len(GLOBAL_APPLICATIONS)*0.001, 22.79 + len(GLOBAL_APPLICATIONS)*0.001]
            ]]
        }
        
        # Admin info from global village
        village_data = GLOBAL_VILLAGES.get(village_id, {})
        admin_info = {
            "village_id": village_id,
            "village": village_data.get("village_name", f"Village_{village_id}"),
            "gp": village_data.get("gp_name", f"GP_{village_id}"),
            "block": village_data.get("block_name", "Mandla"),
            "district": village_data.get("district", "Mandla"),
            "state": village_data.get("state", "Madhya Pradesh"),
            "forest_area_hectares": float(village_data.get("forest_area_hectares", 100.0)),
            "block_id": village_data.get("block_id"),
            "gp_id": village_data.get("gp_id")
        }
        
        # Asset summary (lookup or dummy)
        subset_assets = assets_df[(assets_df["beneficiary_id"] == beneficiary_id) & (assets_df["title_id"] == title_id)]
        asset_summary = {
            "total_area_hectares": float(subset_assets["area_hectares"].sum() if not subset_assets.empty else 2.0 + len(GLOBAL_APPLICATIONS)),
            "asset_types": subset_assets["asset_type"].unique().tolist() if not subset_assets.empty else ["Forest_Patch"],
            "assets_count": len(subset_assets) if not subset_assets.empty else 1
        }
        
        # Vulnerability
        vuln_row = vulnerability_df[vulnerability_df["beneficiary_id"] == beneficiary_id]
        vuln_info = vuln_row.iloc[0].to_dict() if not vuln_row.empty else {"vulnerability_score": 25.0 + len(GLOBAL_APPLICATIONS), "category": "Medium"}
        vulnerability = {
            "score": float(vuln_info.get("vulnerability_score", 25.0)),
            "category": vuln_info.get("category", "Medium")
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