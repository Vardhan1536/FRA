import json
import os
import time
import re
import google.generativeai as genai

class ResourceSuggestionAgent:
    def __init__(self, model):
        self.schemes_text = """
Key Indian government schemes for rural development, water conservation, agriculture, forest rights, and tribal welfare in Madhya Pradesh:

- Pradhan Mantri Krishi Sinchayee Yojana (PMKSY): Irrigation and water management for agriculture.
- Jal Jeevan Mission (under Jal Shakti Abhiyan): Providing safe drinking water through taps, borewells, and conservation.
- Pradhan Mantri Van Dhan Yojana: Developing value chains for forest products, skill training for tribals.
- Mahatma Gandhi National Rural Employment Guarantee Scheme (MGNREGS): Rural employment with focus on natural resource regeneration like water bodies and afforestation.
- Pradhan Mantri Awas Yojana (PMAY): Affordable housing for rural poor, including tribals.
- Saansad Adarsh Gram Yojana (SAGY): Holistic development of model villages.
- Integrated Watershed Development Program (IWMP): Watershed management for soil and water conservation.
- Forest Rights Act (FRA): Recognition of forest rights for tribals and traditional dwellers.
- Tribal Village Development Scheme: Comprehensive development of tribal-majority villages, covering infrastructure and livelihoods.
- Maharishi Balmiki Incentive Scheme: Incentives for tribal communities.
"""
        self.model = model

    def suggest_resources(self, data):
        """
        Suggests prioritized interventions for village improvement based on provided data and government schemes.
        :param data: dict containing village information, land stats, and assets
        :return: dict in the format {"interventions": [{"scheme": str, "description": str, "priority": str}]}
        """
        # Prepare details_str as JSON string with ensure_ascii=False for Unicode
        details_str = json.dumps(data, ensure_ascii=False, indent=2)

        # Construct prompt
        prompt = f"""
You are an expert in rural development and government schemes in India, focusing on Madhya Pradesh.

Here are key schemes:

{self.schemes_text}

Based strictly on the provided village data, analyze metrics like water percentage, vegetation, forest cover, population, tribal population, forest area, and available assets (e.g., water bodies).

Prioritize interventions: 
- Low water percentage or limited water assets -> Suggest water conservation, borewells (e.g., Jal Jeevan Mission).
- High tribal population or forest area -> Suggest forest product value chains, tribal welfare (e.g., Van Dhan Yojana).
- Low vegetation or bare land -> Suggest agriculture, watershed management (e.g., PMKSY, IWMP).
- General rural development -> Employment, housing (e.g., MGNREGS, PMAY).

Suggest 3-5 prioritized interventions linked to schemes, with short descriptions.

Village data: {details_str}

Output ONLY a valid JSON object in this exact format:
{{"interventions": [array of objects like {{"scheme": "scheme_name", "reason":"one liner reason why is this scheme being suggested", "description": "short description of intervention", "priority": "high/medium/low"}}]}}

Do not include any other text outside the JSON.
Do not wrap the JSON in Markdown code blocks.
Ensure suggestions are relevant to the data (e.g., low water index -> borewells under Jal Shakti).
"""
        # Generate content with retry logic
        for attempt in range(3):
            try:
                response = self.model.generate_content(prompt)
                # print("Raw Gemini Response:", response.text)  # Debug
                # Clean the response to remove Markdown code block markers
                cleaned_response = re.sub(r'^```json\s*|\s*```$', '', response.text.strip(), flags=re.MULTILINE)
                output_json = json.loads(cleaned_response)
                return output_json
            except json.JSONDecodeError as e:
                print(f"JSON Decode Error (Attempt {attempt+1}):", str(e))
                print("Response Content:", response.text)
                if attempt < 2:
                    time.sleep(2)
                    continue
                return {"error": "Invalid JSON response from Gemini after retries"}
            except Exception as e:
                print(f"Error (Attempt {attempt+1}):", str(e))
                if attempt < 2:
                    time.sleep(2)
                    continue
                return {"error": f"Failed to generate suggestions: {str(e)}"}

