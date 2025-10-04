from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import json
from monitoring_agent import monitoring_agent
import os
from an_exp import initialize_demo_data,GLOBAL_APPLICATIONS,GLOBAL_VILLAGES
import google.generativeai as genai
from eligibility_check_agent import EligibilityAgent
from dataloader import load_data
from scheme_eligibility import SchemeEligibilityAgent 
from resource_suggestion import ResourceSuggestionAgent
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow your frontend origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)


GLOBAL_MONITORING_RESULTS = {}  # Define the global dictionary here

@app.on_event("startup")
def startup():
    initialize_demo_data()
    api_key = os.getenv("GEMINI_API_KEY", "AIzaSyCSmQzpLgR3XkvxITUhLx-TXAGqp_9qmkk")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')
    agent = EligibilityAgent(model)
    
    for app in GLOBAL_APPLICATIONS:
        agent.check_eligibility(app)
    
    # Add SchemeEligibilityAgent processing
    scheme_agent = SchemeEligibilityAgent(model)
    data = {"beneficiaries": GLOBAL_APPLICATIONS}
    scheme_results = scheme_agent.check_eligibility(data)
    
    # Group results by beneficiary_id and update GLOBAL_APPLICATIONS
    from collections import defaultdict
    grouped_schemes = defaultdict(list)
    for result in scheme_results:
        grouped_schemes[result["beneficiary_id"]].append(result)
    
    for app in GLOBAL_APPLICATIONS:
        beneficiary_id = app["beneficiary_id"]
        app["schemes_eligibility"] = grouped_schemes.get(beneficiary_id, [])
    
    # Add monitoring precomputation
    
    roles = ["DLC", "SDLC", "GramaSabha"]
    global GLOBAL_MONITORING_RESULTS
    GLOBAL_MONITORING_RESULTS = {}
    for role in roles:
        try:
            result_str = monitoring_agent(api_key, role)
            GLOBAL_MONITORING_RESULTS[role] = json.loads(result_str)
        except Exception as e:
            print(f"Error precomputing monitoring for {role}: {str(e)}")
            
            
    global GLOBAL_RESOURCE_SUGGESTIONS
    GLOBAL_RESOURCE_SUGGESTIONS = {}
    resource_agent = ResourceSuggestionAgent(model)  # Assuming it's a class like SchemeEligibilityAgent
    for village_id in GLOBAL_VILLAGES:
        try:
            data = load_data("suggest_resources", village_id,"None")
            if "error" in data:
                print(f"Error loading data for village {village_id}: {data['error']}")
                continue
            result = resource_agent.suggest_resources(data)  # Assuming method name; adjust if different (e.g., check_eligibility or similar)
            GLOBAL_RESOURCE_SUGGESTIONS[village_id] = result
        except Exception as e:
            print(f"Error precomputing resource suggestions for village {village_id}: {str(e)}")

@app.get("/monitor-changes")
async def monitor_changes(role: str = None):
    if not role:
        raise HTTPException(status_code=400, detail="Role is required")
    result = GLOBAL_MONITORING_RESULTS.get(role)
    if not result:
        raise HTTPException(status_code=404, detail="No precomputed monitoring results for this role")
    return result

@app.get("/get-scheme-eligibility")
async def get_scheme_eligibility(role: str = None):
    if not role:
        raise HTTPException(status_code=400, detail="Role is required")
    
    if role == "DLC":
        filtered_records = GLOBAL_APPLICATIONS
    elif role == "SDLC":
        filtered_records = [app for app in GLOBAL_APPLICATIONS if app.get("admin_info", {}).get("block_id") == "BLK_000004"]
    elif role == "GramaSabha":
        filtered_records = [app for app in GLOBAL_APPLICATIONS if app.get("admin_info", {}).get("gp_id") == "GP_000157"]
    else:
        raise HTTPException(status_code=400, detail="Invalid role. Supported roles: DLC, SDLC, GramaSabha")
    
    # Extract only the schemes_eligibility for each filtered beneficiary
    results = []
    for app in filtered_records:
        beneficiary_id = app.get("beneficiary_id")
        schemes = app.get("schemes_eligibility", [])
        results.append({
            "beneficiary_id": beneficiary_id,
            "schemes_eligibility": schemes
        })
    
    return results

@app.get("/get-beneficiaries")
async def get_beneficiaries(role: str = None):
    if not role:
        raise HTTPException(status_code=400, detail="Role is required")
    
    if role == "DLC":
        filtered_records = GLOBAL_APPLICATIONS
    elif role == "SDLC":
        filtered_records = [app for app in GLOBAL_APPLICATIONS if app.get("admin_info", {}).get("block_id") == "BLK_000004"]
    elif role == "GramaSabha":
        filtered_records = [app for app in GLOBAL_APPLICATIONS if app.get("admin_info", {}).get("gp_id") == "GP_000157"]
    else:
        raise HTTPException(status_code=400, detail="Invalid role. Supported roles: dlc, sdlc, gramasabha")
    
    return filtered_records

@app.post("/add-beneficiary")
async def add_beneficiary(request: Request):
    try:
        data = await request.json()
        GLOBAL_APPLICATIONS.append(data)
        # Optionally, update GLOBAL_VILLAGES if needed
        village_id = data.get("admin_info", {}).get("village_id")
        if village_id and village_id not in GLOBAL_VILLAGES:
            village_data = {
                "village_name": data["admin_info"].get("village"),
                "gp_name": data["admin_info"].get("gp"),
                "block_name": data["admin_info"].get("block"),
                "district": data["admin_info"].get("district"),
                "state": data["admin_info"].get("state"),
                "forest_area_hectares": data["admin_info"].get("forest_area_hectares"),
                "gp_id": data["admin_info"].get("gp_id"),
                "block_id": data["admin_info"].get("block_id"),
                "land_stats": {}  # Placeholder, can be expanded if needed
            }
            GLOBAL_VILLAGES[village_id] = village_data
        return {"message": "Beneficiary added successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error adding beneficiary: {str(e)}")

@app.get("/suggest-resources")
async def suggest_resources(role: str = None):
    if not role:
        raise HTTPException(status_code=400, detail="Role is required")
    
    # Determine relevant villages based on role
    relevant_villages = []
    if role == "DLC":
        relevant_villages = list(GLOBAL_VILLAGES.keys())
    elif role == "SDLC":
        for vid, vdata in GLOBAL_VILLAGES.items():
            if vdata.get("block_id") == "BLK_000004":
                relevant_villages.append(vid)
    elif role == "GramaSabha":
        for vid, vdata in GLOBAL_VILLAGES.items():
            if vdata.get("gp_id") == "GP_000157":
                relevant_villages.append(vid)
    else:
        raise HTTPException(status_code=400, detail="Invalid role. Supported roles: DLC, SDLC, GramaSabha")
    
    if not relevant_villages:
        raise HTTPException(status_code=404, detail="No villages found for this role")
    
    # Collect precomputed suggestions for relevant villages
    results = {}
    for vid in relevant_villages:
        suggestion = GLOBAL_RESOURCE_SUGGESTIONS.get(vid)
        if suggestion:
            results[vid] = suggestion
    
    if not results:
        raise HTTPException(status_code=404, detail="No resource suggestions found for this role")
    
    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)