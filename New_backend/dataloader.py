import pandas as pd
import geopandas as gpd
from pathlib import Path
import json

DATA_DIR = Path("data")  # adjust if different

# -------------------------------
# Load required datasets
# -------------------------------
beneficiaries_df = pd.read_csv(DATA_DIR / "mock_fra_beneficiaries_mandla.csv")
titles_df = pd.read_csv(DATA_DIR / "mock_fra_titles_mandla.csv")
assets_df = pd.read_csv(DATA_DIR / "mock_detailed_asset_inventory_mandla.csv")
admin_df = pd.read_csv(DATA_DIR / "mock_administrative_hierarchy_mandla.csv")
schemes_df = pd.read_csv(DATA_DIR / "mock_css_scheme_coverage_mandla.csv")
vulnerability_df = pd.read_csv(DATA_DIR / "mock_vulnerability_assessment_mandla.csv")
land_stats_df = pd.read_csv(DATA_DIR / "landcover_stats_mandla_villages.csv")

# -------------------------------
# Load GeoJSONs (claim boundaries)
# -------------------------------
ifr_gdf = gpd.read_file(DATA_DIR / "mock_fra_ifr_boundaries_mandla.geojson")
cr_gdf = gpd.read_file(DATA_DIR / "mock_fra_cr_boundaries_mandla.geojson")
cfr_gdf = gpd.read_file(DATA_DIR / "mock_fra_cfr_boundaries_mandla.geojson")

# -------------------------------
# Helper functions
# -------------------------------
def get_beneficiary_info(beneficiary_id: str) -> dict:
    row = beneficiaries_df.loc[beneficiaries_df["beneficiary_id"] == beneficiary_id]
    return row.iloc[0].to_dict() if not row.empty else {}

def get_title_info(title_id: str) -> dict:
    row = titles_df.loc[titles_df["title_id"] == title_id]
    return row.iloc[0].to_dict() if not row.empty else {}

def get_admin_info(village_id: str) -> dict:
    row = admin_df.loc[admin_df["village_id"] == village_id]
    return row.iloc[0].to_dict() if not row.empty else {}

def get_asset_summary(beneficiary_id: str, title_id: str) -> dict:
    """Aggregate area and list asset types for the beneficiary."""
    subset = assets_df.loc[
        (assets_df["beneficiary_id"] == beneficiary_id)
        & (assets_df["title_id"] == title_id)
    ]
    if subset.empty:
        return {"total_area_hectares": 0, "asset_types": [], "assets_count": 0}

    total_area = subset["area_hectares"].sum()
    asset_types = subset["asset_type"].unique().tolist()

    return {
        "total_area_hectares": float(total_area),
        "asset_types": asset_types,
        "assets_count": len(subset),
    }

def get_vulnerability_info(beneficiary_id: str) -> dict:
    row = vulnerability_df.loc[vulnerability_df["beneficiary_id"] == beneficiary_id]
    return row.iloc[0].to_dict() if not row.empty else {}

def get_boundary_coordinates(beneficiary_id: str, title_id: str, claim_type: str):
    """Fetch polygon boundary coordinates from the right GeoJSON based on claim type."""
    if claim_type == "IFR":
        gdf = ifr_gdf
    elif claim_type == "CR":
        gdf = cr_gdf
    elif claim_type == "CFR":
        gdf = cfr_gdf
    else:
        return []

    subset = gdf.loc[
        (gdf["beneficiary_id"] == beneficiary_id)
        & (gdf["title_id"] == title_id)
    ]
    if subset.empty:
        return []

    coords = []
    for geom in subset.geometry:
        if geom.geom_type == "Polygon":
            coords.append(list(geom.exterior.coords))
        elif geom.geom_type == "MultiPolygon":
            for poly in geom.geoms:
                coords.append(list(poly.exterior.coords))
    return coords

def get_land_stats(village_id: str) -> dict:
    """Fetch land statistics from landcover_stats_mandla_villages.csv."""
    row = land_stats_df.loc[land_stats_df["village_id"] == village_id]
    if row.empty:
        return {}
    land_stats = {
        "Water_sq_km": float(row.iloc[0]["Water_sq_km"]),
        "Vegetation_sq_km": float(row.iloc[0]["Vegetation_sq_km"]),
        "Forest_sq_km": float(row.iloc[0]["Forest_sq_km"]),
        "Built_up_sq_km": float(row.iloc[0]["Built_up_sq_km"]),
        "Bare_Land_sq_km": float(row.iloc[0]["Bare_Land_sq_km"]),
        "Other_sq_km": float(row.iloc[0]["Other_sq_km"]),
        "Total_Area_sq_km": float(row.iloc[0]["Total_Area_sq_km"]),
        "Water_percent": float(row.iloc[0]["Water_percent"]),
        "Vegetation_percent": float(row.iloc[0]["Vegetation_percent"]),
        "Forest_percent": float(row.iloc[0]["Forest_percent"]),
        "Built_up_percent": float(row.iloc[0]["Built_up_percent"]),
        "Bare_Land_percent": float(row.iloc[0]["Bare_Land_percent"]),
        "Other_percent": float(row.iloc[0]["Other_percent"])
    }
    # if land_stats["Other_sq_km"] < 0 or land_stats["Other_percent"] < 0:
    #     print(f"Warning: Negative values in land_stats for village_id {village_id}: {land_stats}")
    #     land_stats["Other_sq_km"] = 0
    #     land_stats["Other_percent"] = 0
    return land_stats

# -------------------------------
# Data Loader
# -------------------------------
def load_data(work: str, input_id: str, query: None) -> dict:
    """
    Load data based on the specified work and input ID.
    :param work: str, one of 'eligibility_check', 'suggest_resources', 'legal_assistance'
    :param input_id: str, village_id for suggest_resources, or beneficiary_id,title_id for others
    :return: dict with data formatted for the specified agent
    """
    if work not in ["eligibility_check", "suggest_resources", "legal_assistance"]:
        return {"error": f"Invalid work type: {work}. Must be 'eligibility_check', 'suggest_resources', or 'legal_assistance'"}

    if work == "suggest_resources":
        village_id = input_id
        admin_info = get_admin_info(village_id)
        if not admin_info:
            return {"error": f"No village found with id {village_id}"}
        
        land_stats = get_land_stats(village_id)
        if not land_stats:
            return {"error": f"No land stats found for village_id {village_id}"}
        
        return {
            "village_id": village_id,
            "village_name": admin_info.get("village_name"),
            "gp_id": admin_info.get("gp_id"),
            "gp_name": admin_info.get("gp_name"),
            "block_id": admin_info.get("block_id"),
            "block_name": admin_info.get("block_name"),
            "district": admin_info.get("district"),
            "state": admin_info.get("state"),
            "latitude": float(admin_info.get("latitude")) if pd.notna(admin_info.get("latitude")) else None,
            "longitude": float(admin_info.get("longitude")) if pd.notna(admin_info.get("longitude")) else None,
            "population": int(admin_info.get("population")) if pd.notna(admin_info.get("population")) else None,
            "tribal_population": int(admin_info.get("tribal_population")) if pd.notna(admin_info.get("tribal_population")) else None,
            "land_stats": land_stats
        }
    
    elif work in ["eligibility_check", "legal_assistance"]:
        try:
            beneficiary_id, title_id = input_id.split(",")
        except ValueError:
            return {"error": "Input must be 'beneficiary_id,title_id'"}
        
        # else:  # legal_assistance
        #     try:
        #         # Parse extra_details for beneficiary_id and title_id
        #         details = dict(item.strip().split(": ") for item in extra_details.split(", ") if ": " in item)
        #         beneficiary_id = details.get("Beneficiary ID")
        #         title_id = details.get("Title ID")
        #         print(f"from dataloader {title_id},{beneficiary_id}")
        #         if not beneficiary_id or not title_id:
        #             return {"error": "extra_details must include 'Beneficiary ID' and 'Title ID'"}
        #     except Exception:
        #         return {"error": "Invalid extra_details format, must be 'Beneficiary ID: <id>, Title ID: <id>'"}
        
        beneficiary_info = get_beneficiary_info(beneficiary_id)
        title_info = get_title_info(title_id)
        if not beneficiary_info:
            return {"error": f"No beneficiary found with id {beneficiary_id}"}
        if not title_info:
            return {"error": f"No title found with id {title_id}"}
        
        village_id = beneficiary_info.get("village_id") or title_info.get("village_id")
        admin_info = get_admin_info(village_id)
        
        if work == "eligibility_check":
            asset_info = get_asset_summary(beneficiary_id, title_id)
            vulnerability_info = get_vulnerability_info(beneficiary_id)
            claim_type = title_info.get("right_type")
            polygon_coords = get_boundary_coordinates(beneficiary_id, title_id, claim_type)
            
            data = {
                "beneficiary_id": beneficiary_id,
                "title_id": title_id,
                "personal_info": {
                    "first_name": beneficiary_info.get("first_name"),
                    "last_name": beneficiary_info.get("last_name"),
                    "gender": beneficiary_info.get("gender"),
                    "tribal_community": beneficiary_info.get("tribal_community"),
                    "aadhaar": beneficiary_info.get("aadhaar_number"),
                    "income": beneficiary_info.get("annual_income"),
                },
                "title_info": {
                    "right_type": title_info.get("right_type"),
                    "status": title_info.get("status"),
                    "claim_area_hectares": title_info.get("area_hectares"),
                    "polygon_coordinates": polygon_coords,
                },
                "admin_info": {
                    "village": admin_info.get("village_name"),
                    "gp": admin_info.get("gp_name"),
                    "block": admin_info.get("block_name"),
                    "district": admin_info.get("district"),
                    "state": admin_info.get("state"),
                    "forest_area_hectares": admin_info.get("forest_area_hectares"),
                },
                "asset_summary": asset_info,
                "vulnerability": {
                    "score": vulnerability_info.get("vulnerability_score"),
                    "category": vulnerability_info.get("category"),
                },
            }
        else:  
            claim_type = title_info.get("right_type")
            polygon_coords = get_boundary_coordinates(beneficiary_id, title_id, claim_type)
            data = {
                "beneficiary_id": beneficiary_id,
                "title_id": title_id,
                "personal_info": {
                    "first_name": beneficiary_info.get("first_name"),
                    "last_name": beneficiary_info.get("last_name"),
                    "gender": beneficiary_info.get("gender"),
                    "tribal_community": beneficiary_info.get("tribal_community"),
                    "aadhaar": beneficiary_info.get("aadhaar_number"),
                    "income": beneficiary_info.get("annual_income"),
                },
                "title_info": {
                    "right_type": title_info.get("right_type"),
                    "status": title_info.get("status"),
                    "claim_area_hectares": title_info.get("area_hectares"),
                    "polygon_coordinates": polygon_coords,
                },
                "admin_info": {
                    "village": admin_info.get("village_name"),
                    "gp": admin_info.get("gp_name"),
                    "block": admin_info.get("block_name"),
                    "district": admin_info.get("district"),
                    "state": admin_info.get("state"),
                    "forest_area_hectares": admin_info.get("forest_area_hectares"),
                },
                "evidence": [
                    {"type": "government_record", "description": "Land occupancy record from 2004"},
                    {"type": "elder_statement", "description": "Statement from village elder confirming residence since 1990"}
                ],
                "issue_description": query
            }
        
        return data
    
# -------------------------------
# Example Run
# -------------------------------
# if __name__ == "__main__":
#     # Test suggest_resources
#     result = load_data("suggest_resources", "VIL_000001")
#     print("suggest_resources data:")
#     print(json.dumps(result, indent=2, ensure_ascii=False))
    
    # # Test eligibility_check
    # result = load_data("eligibility_check", "FRA_00000020,FRA_TITLE_00000014","empty")
    # print("\neligibility_check data:")
    # print(json.dumps(result, indent=2, ensure_ascii=False))
    
#     # Test legal_assistance
#     result = load_data("legal_assistance", "FRA_00000020,FRA_TITLE_00000014")
#     print("\nlegal_assistance data:")
#     print(json.dumps(result, indent=2, ensure_ascii=False))