
import json
import os
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai
from eligibility_check_agent import EligibilityAgent
from legal_assistance_agent import LegalAssistanceAgent
from resource_suggestion import ResourceSuggestionAgent
from dataloader import load_data
from an_exp import initialize_demo_data,  GLOBAL_APPLICATIONS # Add this import

# Load environment variables
load_dotenv()
genai.configure(api_key=os.getenv("AIzaSyDVIEQJ3rbll37mQV4N0wRpbufqRBQLN4I"))

class AgenticFlow:
    def __init__(self, model_name='gemini-2.5-flash'):
        # Initialize Gemini model once
        self.model = genai.GenerativeModel(model_name)
        # Initialize agents
        self.eligibility_agent = EligibilityAgent(self.model)  # Assumes no LLM needed
        self.legal_assistance_agent = LegalAssistanceAgent(self.model)
        self.resource_suggestion_agent = ResourceSuggestionAgent(self.model)

    def run_flow(self, work: str, input_id: str, query: str = None) -> dict:
        """
        Run the agentic flow based on work type and input.
        :param work: str, one of 'eligibility_check', 'suggest_resources', 'legal_assistance'
        :param input_id: str, village_id for suggest_resources, beneficiary_id,title_id for eligibility_check, or query for legal_assistance
        :param extra_details: str, optional additional details for legal_assistance
        :return: dict with results from the relevant agent
        """
        # Validate work type
        if work not in ["eligibility_check", "suggest_resources", "legal_assistance"]:
            return {"error": f"Invalid work type: {work}. Must be 'eligibility_check', 'suggest_resources', or 'legal_assistance'"}

        result = {"work": work, "input_id": input_id}

        if work == "eligibility_check":
            # Send the entire GLOBAL_APPLICATIONS to the eligibility checker
            eligibility_profiles = []
            for data in GLOBAL_APPLICATIONS:
                try:
                    profile = self.eligibility_agent.check_eligibility(data)
                    eligibility_profiles.append(profile)
                except Exception as e:
                    print(f"Error processing {data.get('beneficiary_id')}: {str(e)}")
            result["eligibility_profiles"] = eligibility_profiles

        elif work == "suggest_resources":
            # Load data for suggest_resources
            try:
                data = load_data(work, input_id)
                if "error" in data:
                    return {"error": data["error"]}
            except Exception as e:
                return {"error": f"Data loading failed: {str(e)}"}
            
            # Run ResourceSuggestionAgent
            result["resource_suggestions"] = self.resource_suggestion_agent.suggest_resources(data)

        elif work == "legal_assistance":
            try:
                print(f" work:{work}, input_id:{input_id}, extra_details:{query}")
                data = load_data(work, input_id, query)
                if "error" in data:
                    return {"error": data["error"]}
            except Exception as e:
                return {"error": f"Data loading failed: {str(e)}"}
            # Pass query and extra_details to LegalAssistanceAgent
            result["legal_assistance"] = self.legal_assistance_agent.provide_legal_assistance(data)

        return result

# Example Run
if __name__ == "__main__":
    initialize_demo_data()  # Add this call to populate GLOBAL_APPLICATIONS
    flow = AgenticFlow()
    # Test suggest_resources
    # result = flow.run_flow("suggest_resources", "VIL_000001")
    # print("suggest_resources result:")
    # print(json.dumps(result, indent=2, ensure_ascii=False))
    
    # Test eligibility_check
    result = flow.run_flow("eligibility_check", "FRA_00000005,FRA_TITLE_00000005", "empty")
    print("\neligibility_check result:")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    # # Test legal_assistance
    # result = flow.run_flow("legal_assistance", "FRA_00000020,FRA_TITLE_00000014","How to resolve FRA claim disputes?")
    # print("\nlegal_assistance result:")
    # print(json.dumps(result, indent=2, ensure_ascii=False))