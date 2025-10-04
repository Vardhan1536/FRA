
import json
import os
import time
import re
import google.generativeai as genai


class LegalAssistanceAgent:
    def __init__(self, model):
        self.rules_text = """
The Forest Rights Act, 2006 (FRA) recognizes and vests forest rights in forest-dwelling Scheduled Tribes (FDST) and other traditional forest dwellers (OTFD) to address historical injustices and ensure land tenure and livelihood security.

Key Definitions (Section 2):
- Forest dwelling Scheduled Tribes (FDST): Members or communities of Scheduled Tribes (per Article 342 of the Constitution) who primarily reside in and depend on forests or forest lands for bona fide livelihood needs.
- Other traditional forest dweller (OTFD): Any member or community residing in forest or forest land for at least three generations (75 years) prior to 13th December 2005 for bona fide livelihood needs.
- Forest land: Any land within a forest area, including unclassified, undemarcated, protected, or reserved forests, Sanctuaries, and National Parks.
- Critical wildlife habitat: Areas in national parks and sanctuaries identified as inviolate for wildlife conservation by an Expert Committee.
- Gram Sabha: Village assembly consisting of all adult members, with full and unrestricted participation of women.

Rights Recognized (Section 3):
- Right to hold and live in forest land under individual or common occupation for habitation or self-cultivation for livelihood, not exceeding 4 hectares (Section 3(1)(a), Section 4(6)).
- Community rights such as nistar, grazing, fishing waters, access to biodiversity (Section 3(1)(b), (d), (e), (i), (k)).
- Rights to in situ rehabilitation for those illegally evicted or displaced prior to 13-12-2005 (Section 3(1)(m)).

Recognition and Vesting (Section 4):
- Rights vest in FDSTs and OTFDs subject to conditions (Section 4(1)).
- Occupation must be before 13 December 2005 (Section 4(3)).
- Rights are heritable but not alienable or transferable (Section 4(4)).
- Maximum area for habitation/self-cultivation: Area under actual occupation, not exceeding 4 hectares (Section 4(6)).
- For OTFDs, proof of 75 years residence required (Section 2(o)).
- No eviction until verification is complete (Section 4(5)).
- Holders have duties to protect wildlife, forest, and biodiversity (Section 5).
- Overlaps with critical wildlife habitats require relocation if inviolate (Section 4(2)).

Authorities and Process (Section 6, Rules 2012):
- Gram Sabha initiates process, constitutes Forest Rights Committee (FRC) for verification (Rule 11, 12).
- Claims filed in Form A for individual rights (Annexure I).
- FRC verifies claims with at least two evidences from Rule 13 (e.g., government records, elder statements, physical attributes like houses, wells, sacred sites).
- Gram Sabha approves claims via resolution.
- Sub-Divisional Level Committee (SDLC) examines resolutions, prepares records.
- District Level Committee (DLC) approves and issues titles (Rule 8).
- Titles issued in joint names of spouses or single head, heritable (Rule 8(h)).
- No time limit for filing claims (FAQ, no deadline in Act).

Evidence Requirements (Rule 13):
- At least two pieces of evidence required, such as government records, caste certificates, elder statements, physical evidence (e.g., houses, crops), or maps.
- For OTFDs, evidence of 75 years residence is mandatory.

Handling Conflicts/Overlapping Claims:
- Gram Sabha resolves petty disputes and overlapping claims during verification (Rule 12A(3)).
- SDLC remands unresolved cases back to Gram Sabha with guidance (Rule 12A(6)).
- DLC finalizes after ensuring due process; rejects if fraudulent, post-2005 occupation, or unresolved conflicts (Rule 12A).
- Duplicate FRA titles are ineligible.

Rejection Reasons:
- Claimant is not FDST or OTFD (Section 2(c), 2(o)).
- Occupation after 13-12-2005 (Section 4(3)).
- Insufficient evidence (Rule 13).
- Claim exceeds 4 hectares (Section 4(6)).
- Alienation or transfer attempted (Section 4(4)).
- Unresolved conflicts with other claims (Rule 12A).
- Violation of conservation duties or offences like false claims (Sections 5, 7).

Offences and Penalties (Section 7):
- Contravention of FRA provisions or rules is an offence, punishable with a fine up to INR 1,000 or as prescribed.
- False claims or fraudulent evidence submission may lead to rejection and legal action (Section 7).

Other Regulations:
- Convergence with other schemes for development facilities (Section 3(2)).
- Act overrides inconsistent laws (Section 13).
- For additional procedural details, refer to the full Forest Rights Act, 2006, and 2012 Rules.
"""
        self.model = model

    def provide_legal_assistance(self, query):
        """
        Provides legal assistance for FRA-related issues based on provided query.
        :param query: string describing the issue or question
        :return: dict in the format {"issue_description": string, "tips": [list of tips], "relevant_sections": [list of sections/rules]}
        """
        # No need for masking since input is query string
        query_str = query

        # Construct prompt
        prompt = f"""
You are an expert on the Forest Rights Act, 2006 (FRA) in India, tasked with providing legal assistance to officers handling FRA-related issues.

Here are the key rules and regulations for FRA, including eligibility, processes, conflicts, and offences:

{self.rules_text}

Based on the provided query, analyze the legal issue, classify its type, and provide actionable tips for resolution.

Input query: {query_str}

**Instructions**:
- Identify the type of legal issue (e.g., eligibility dispute, conflict over land, fraudulent claim, procedural error, eviction issue).
- Provide a concise, straightforward description of the issue type (1-2 sentences), focusing on the core problem and its relevance to FRA.
- Suggest 2-3 short, actionable tips to resolve the issue, each as a concise sentence referencing relevant FRA sections or rules if applicable.
- List relevant FRA sections or 2012 Rules that apply to the issue.
- Output **ONLY** a valid JSON object in this exact format: {{"issue_description": "string describing the issue type and details", "tips": [array of 2-3 short sentences with actionable advice], "relevant_sections": [array of relevant section or rule numbers]}}
- Do **not** include any additional text, explanations, or comments outside the JSON object.
- Do **not** wrap the JSON in Markdown code blocks (e.g., ```json ... ```).
- Ignore sensitive data (e.g., Aadhaar numbers) but do not fail the request.
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
                # Reorder JSON to have issue_description first
                reordered_json = {
                    "issue_description": output_json["issue_description"],
                    "tips": output_json["tips"],
                    "relevant_sections": output_json["relevant_sections"]
                }
                return reordered_json
            except json.JSONDecodeError as e:
                print(f"JSON Decode Error (Attempt {attempt+1}):", str(e))
                print("Response Content:", response.text)
                if attempt < 2:
                    time.sleep(2)
                    continue
                raise ValueError("Invalid JSON response from Gemini after retries")

# # Example usage
# if __name__ == "__main__":
#     query = "The claimant's approved IFR title is contested by another villager claiming overlapping land, leading to a dispute at the Gram Sabha."

#     agent = LegalAssistanceAgent()
#     result = agent.provide_legal_assistance(query)
#     print(json.dumps(result, indent=2))