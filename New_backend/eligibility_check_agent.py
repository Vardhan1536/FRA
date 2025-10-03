# Updated EligibilityAgent code
import json
import os
import time
import re
import google.generativeai as genai
from conflict_resolver import ConflictAgent  # Assuming this is the module for ConflictAgent
from an_exp import GLOBAL_APPLICATIONS  # Import GLOBAL_APPLICATIONS

class EligibilityAgent:
    def __init__(self, model):
        self.rules_text = """
The Forest Rights Act, 2006 (FRA) recognizes and vests forest rights in forest-dwelling Scheduled Tribes (FDST) and other traditional forest dwellers (OTFD) to address historical injustices and ensure land tenure and livelihood security.

Key Definitions (Section 2):
- Forest dwelling Scheduled Tribes (FDST): Members or communities of Scheduled Tribes (per Article 342 of the Constitution) who primarily reside in and depend on forests or forest lands for bona fide livelihood needs.
- Other traditional forest dweller (OTFD): Any member or community residing in forest or forest land for at least three generations (75 years) prior to 13th December 2005 for bona fide livelihood needs.
- Forest land: Any land within a forest area, including unclassified, undemarcated, protected, or reserved forests, Sanctuaries, and National Parks.
- Critical wildlife habitat: Areas in national parks and sanctuaries identified as inviolate for wildlife conservation by an Expert Committee.

Rights Recognized (Section 3):
- Right to hold and live in forest land under individual or common occupation for habitation or self-cultivation for livelihood, not exceeding 4 hectares (Section 3(1)(a), Section 4(6)).

Recognition and Vesting (Section 4):
- Rights vest in FDSTs and OTFDs subject to conditions (Section 4(1)).
- Occupation must be before 13 December 2005 (Section 4(3)).
- Rights are heritable but not alienable or transferable (Section 4(4)).
- Maximum area for habitation/self-cultivation: Area under actual occupation, not exceeding 4 hectares (Section 4(6)).
- For OTFDs, proof of 75 years residence required (Section 2(o)).
- No eviction until verification is complete (Section 4(5)).
- Holders have duties to protect wildlife, forest, and biodiversity (Section 5).

Handling Conflicts/Overlapping Claims:
- Unresolved conflicts with other claims lead to rejection (Rule 12A).
- Overlaps with critical wildlife habitats require relocation if inviolate (Section 4(2)).
- Duplicate FRA titles are ineligible.

Rejection Reasons:
- Claimant is not FDST or OTFD (Section 2(c), 2(o)).
- Occupation after 13-12-2005 (Section 4(3)).
- Insufficient evidence (Rule 13).
- Claim exceeds 4 hectares (Section 4(6)).
- Alienation or transfer attempted (Section 4(4)).
- Unresolved conflicts with other claims (Rule 12A).
- Violation of conservation duties or false claims (Sections 5, 7).

Additional Details:
- For procedural details (e.g., Gram Sabha, FRC, SDLC, DLC processes) or other rights, refer to the full Forest Rights Act, 2006, and 2012 Rules.
"""
        self.model = model

    def check_eligibility(self, data):
        """
        Checks eligibility using the provided data and calls ConflictAgent for conflict detection.
        :param data: dict containing the beneficiary information
        :return: dict in the format {"eligibility": bool, "reasons": list}
        """
        beneficiary_id = data["beneficiary_id"]
        title_id = data["title_id"]
        polygon_coordinates = data["title_info"]["polygon_coordinates"]

        # Detect conflicts using ConflictAgent
        conflict_agent = ConflictAgent()
        conflict_result = conflict_agent.detect_conflicts(beneficiary_id, title_id, polygon_coordinates)

        conflicts_str = ""
        conflicting_title_ids = []
        if conflict_result["conflict_detected"]:
            conflicts = conflict_result["conflicts"]
            conflicting_title_ids = [c["conflicting_title_id"] for c in conflicts]
            conflicts_str = "Conflicts with: " + ", ".join(
                [f"{c['conflicting_title_id']} (beneficiary {c['other_beneficiary_id']})" for c in conflicts]
            )

        # Mask sensitive data (e.g., Aadhaar)
        data_copy = json.loads(json.dumps(data))
        if "personal_info" in data_copy and "aadhaar" in data_copy["personal_info"]:
            data_copy["personal_info"]["aadhaar"] = "XXXX-XXXX-XXXX"
        details_str = json.dumps(data_copy, ensure_ascii=False, indent=2)

        # Construct prompt
        prompt = f"""
You are an expert on the Forest Rights Act, 2006 (FRA) in India for determining patta eligibility.

Here are the key rules and regulations for FRA patta approval, focusing on eligibility criteria:

{self.rules_text}

Now, based strictly on the above rules, verify the provided beneficiary details against the eligibility criteria, cut-off dates, evidence requirements, maximum area, and other regulations.

Beneficiary details (including name, full address, village, caste, area occupied, and all other provided info): {details_str}

Conflicts with other persons' claims (if any, include details like conflicting title IDs and beneficiary IDs): {conflicts_str}

Determine if the beneficiary is eligible for a FRA land patta claim under right type's criteria.

If there is a conflict with other persons' land claims, handle it by rejecting or noting as ineligible, providing details in reasons.

**Important Instructions**:
- Output **ONLY** a valid JSON object in this exact format: {{"eligibility": true or false, "reasons": [array of max 7 short and clear easily understandable sentences for rejections, each with proper reason and mentioning relevant FRA sections or rules if applicable. If eligible, empty array.]}}
- Do **not** include any additional text, explanations, or comments outside the JSON object.
- Do **not** wrap the JSON in Markdown code blocks (e.g., ```json
- Ignore sensitive data (e.g., Aadhaar numbers) for eligibility but do not fail the request.
- Ensure the response is valid JSON and fits within token limits.
- For additional procedural details, refer to the full Forest Rights Act, 2006, and 2012 Rules.
"""
        # Generate content with retry logic
        for attempt in range(3):
            try:
                response = self.model.generate_content(prompt)
                # print("Raw Gemini Response:", response.text)  # Debug
                # Clean the response to remove Markdown code block markers
                cleaned_response = re.sub(r'^```json\s*|\s*```$', '', response.text.strip(), flags=re.MULTILINE)
                output_json = json.loads(cleaned_response)
                # Fix typo: Add beneficiary_id and beneficiary_title (corrected spelling)
                output_json["beneficiary_id"] = beneficiary_id
                output_json["beneficiary_title"] = title_id
                output_json["conflicting_title_ids"] = conflicting_title_ids
                
                # Update the global dictionary with SDLC status
                for app in GLOBAL_APPLICATIONS:
                    if app["beneficiary_id"] == beneficiary_id and app["title_id"] == title_id:
                        app["statuses"]["sdlc"] = {
                            "review": output_json["eligibility"],
                            "remarks": output_json["reasons"]
                        }
                        break
                
                return output_json
            except json.JSONDecodeError as e:
                print(f"JSON Decode Error (Attempt {attempt+1}):", str(e))
                print("Response Content:", response.text)
                if attempt < 2:
                    time.sleep(2)
                    continue
                raise ValueError("Invalid JSON response from Gemini after retries")
