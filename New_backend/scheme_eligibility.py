import json
import os
import time
import re
import google.generativeai as genai

class SchemeEligibilityAgent:
    def __init__(self, model):
        self.rules_text = """
The Forest Rights Act, 2006 (FRA) helps tribes and forest dwellers in India. It gives them rights to land, forest products, and more. Many schemes use FRA rules to help these people.

Here are key schemes that help forest-dwelling Scheduled Tribes (FDST) and other traditional forest dwellers (OTFD). Use FRA rules to check if a person can get each scheme. FDST are Scheduled Tribes who live in and depend on forests. OTFD are others who lived in forests for 75 years before December 13, 2005.

1. Individual Forest Rights (IFR) under FRA:
   - For FDST or OTFD.
   - Must live on forest land before December 13, 2005.
   - For home or farming, up to 4 hectares.
   - Sections: 3(1)(a), 4(3), 4(6), 2(c), 2(o).

2. Community Forest Rights (CFR) under FRA:
   - For groups of FDST or OTFD.
   - For using and managing forest areas together.
   - Claim must come from Gram Sabha.
   - Sections: 3(1)(i), 3(1)(b), 2(c), 2(o).

3. Rights to Minor Forest Produce (MFP) under FRA:
   - For FDST or OTFD.
   - Right to collect, own, and sell things like fruits, honey from forest.
   - Must depend on forest for living.
   - Section: 3(1)(c), 2(c), 2(o).

4. Habitat Rights for Particularly Vulnerable Tribal Groups (PVTG) under FRA:
   - For PVTG who are special weak tribes.
   - Right to live in their old home areas in forest.
   - Must be identified as PVTG.
   - Section: 3(1)(e), 2(c).

5. Pradhan Mantri Van Dhan Yojana (PMVDY):
   - For Scheduled Tribes collecting forest products.
   - Helps add value and sell MFP.
   - Must have FRA rights for MFP or be FDST/OTFD.
   - Linked to FRA Section: 3(1)(c).

6. Eklavya Model Residential Schools (EMRS):
   - For children of Scheduled Tribes.
   - Gives good school and hostel.
   - Parent must be ST, and child from tribal area.
   - Linked to FRA as it helps FDST kids (Section 2(c)).

7. Special Central Assistance to Tribal Sub-Scheme (SCA to TSS):
   - For Scheduled Tribes in forest areas.
   - Helps with jobs, health, education.
   - Must be ST or OTFD under FRA.
   - Linked to FRA Sections: 2(c), 2(o).

8. Development of Particularly Vulnerable Tribal Groups (PVTG) Scheme:
   - For PVTG in forests.
   - Helps with homes, water, roads.
   - Must be PVTG and live in forest.
   - Linked to FRA Section: 3(1)(e).

Check each scheme for each person using these rules. Use simple checks based on person's tribe status, live date, area, and other info.
"""
        self.model = model

    def check_eligibility(self, data):
        """
        Checks eligibility for schemes using the provided data for all beneficiaries.
        :param data: dict containing 'beneficiaries': list of beneficiary information dicts
        :return: list of dicts in the format [{"scheme_name": str, "beneficiary_id": str, "eligibility": bool, "reasons": list}]
        """
        beneficiaries = data.get("beneficiaries", [])
        details_str = ""

        for beneficiary in beneficiaries:
            beneficiary_id = beneficiary.get("beneficiary_id", "")
            # Mask sensitive data (e.g., Aadhaar)
            data_copy = json.loads(json.dumps(beneficiary))
            if "personal_info" in data_copy and "aadhaar" in data_copy["personal_info"]:
                data_copy["personal_info"]["aadhaar"] = "XXXX-XXXX-XXXX"
            details_str += f"Beneficiary {beneficiary_id}: {json.dumps(data_copy, ensure_ascii=False, indent=2)}\n\n"

        # Construct prompt
        prompt = f"""
You are an expert on schemes for tribes and forest dwellers in India based on Forest Rights Act, 2006 (FRA).

Here are the schemes and simple rules to check who can get them:

{self.rules_text}

Now, based only on the above rules, check each beneficiary for each scheme.

Beneficiaries details (with name, address, village, caste, area, occupation date, and all other info): 

{details_str}

For each beneficiary and each scheme, decide if eligible.

Use simple English. If not eligible, give reasons in a list of up to 4 short sentences. Each reason must tell the full problem and mention the right FRA section or rule.

**Important Instructions**:
- Output **ONLY** a valid JSON array of objects. Each object in this exact format: {{"scheme_name": "scheme name here", "beneficiary_id": "id here", "eligibility": true or false, "reasons": [array of up to 4 short simple sentences if not eligible, empty array if eligible]}}
- The array must have one object for each beneficiary-scheme pair. List all schemes for each beneficiary.
- Do **not** include any extra text, notes, or comments outside the JSON array.
- Do **not** wrap the JSON in Markdown code blocks like ```json.
- Ignore sensitive data like Aadhaar for checks but do not reject for it.
- Make sure response is valid JSON.
- Use simple English in reasons.
- Mention proper FRA sections or rules in each reason.
- Follow all these rules strictly.
"""
        # Generate content with retry logic
        for attempt in range(3):
            try:
                response = self.model.generate_content(prompt)
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
                raise ValueError("Invalid JSON response from Gemini after retries")