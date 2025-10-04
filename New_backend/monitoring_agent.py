import pandas as pd
import json
import google.generativeai as genai

def monitoring_agent(api_key, role):
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')

    # Load the change detection data
    try:
        df_change = pd.read_csv('data/mock_temporal_change_detection_mandla.csv')
    except FileNotFoundError:
        print(f"Falling back to mock_data")
        change_data = {
            'change_id': ['CHANGE_00000001'],
            'asset_id': ['ASSET_00018485'],
            'beneficiary_id': ['FRA_00007277'],
            'village_id': ['VIL_000363'],
            'detection_date': ['2020-12-11'],
            'change_type': ['Reforestation'],
            'area_change_hectares': [0.27],
            'confidence_score': [0.608],
            'detection_method': ['Landsat-8'],
            'verification_status': ['Pending'],
            'verification_date': ['2020-03-08'],
            'verified_by': [''],
            'impact_assessment': ['Positive'],
            'recommended_action': ['No_Action'],
            'notes': ['Detected via ML_Algorithm']
        }
        df_change = pd.DataFrame(change_data)

    # Load the administrative hierarchy data
    try:
        df_admin = pd.read_csv('data/mock_administrative_hierarchy_mandla.csv')
    except FileNotFoundError:
        admin_data = {
            'village_id': ['VIL_000001'],
            'village_name': ['चिरमिरी'],
            'gp_id': ['GP_000001'],
            'gp_name': ['GP_फतेहपुर'],
            'block_id': ['BLK_000001'],
            'block_name': ['Mandla'],
            'district': ['Mandla'],
            'state': ['Madhya Pradesh'],
            'latitude': [22.220009],
            'longitude': [80.275029],
            'population': [957],
            'tribal_population': [172],
            'forest_area_hectares': [140.998070468603]
        }
        df_admin = pd.DataFrame(admin_data)

    # Merge df_change with df_admin to add hierarchy details
    df_change = df_change.merge(df_admin[['village_id', 'gp_id', 'gp_name', 'block_id', 'block_name', 'district']], on='village_id', how='left')

    # Determine base values from the first row
    if not df_change.empty:
        base_gp_id = df_change['gp_id'].iloc[0]
        base_block_id = df_change['block_id'].iloc[0]
        base_district = df_change['district'].iloc[0]
    else:
        base_gp_id = base_block_id = base_district = None

    # Filter based on role
    if role == 'GramaSabha':
        filtered = df_change[df_change['gp_id'] == base_gp_id].head(2)
    elif role == 'sdlc':
        all_block_ids = df_admin['block_id'].unique()
        other_block_id = next((b for b in all_block_ids if b != base_block_id), base_block_id)
        two_blocks = [base_block_id, other_block_id]
        filtered = pd.concat([
            df_change[df_change['block_id'] == base_block_id].head(2),
            df_change[df_change['block_id'] == other_block_id].head(2)
        ]).head(4)  # Total 4 entries, 2 per block
    elif role == 'dlc':
        all_block_ids = df_admin['block_id'].unique()
        other_block_id = next((b for b in all_block_ids if b != base_block_id), base_block_id)
        two_blocks = [base_block_id, other_block_id]
        filtered = pd.concat([
            df_change[df_change['block_id'] == base_block_id].head(2),
            df_change[df_change['block_id'] == other_block_id].head(2)
        ]).head(4)  # Total 4 entries, 2 per block
    else:
        filtered = df_change.head(5)

    # Load asset inventory
    try:
        df_asset = pd.read_csv('data/mock_detailed_asset_inventory_mandla.csv')
    except FileNotFoundError:
        df_asset = pd.DataFrame(columns=['asset_id', 'title_id', 'beneficiary_id', 'village_id'])

    # Load FRA titles
    try:
        df_titles = pd.read_csv('data/mock_fra_titles_mandla.csv')
    except FileNotFoundError:
        df_titles = pd.DataFrame(columns=['title_id', 'beneficiary_id', 'village_id', 'right_type'])

    results = []
    for index, row in filtered.iterrows():
        change_id = row['change_id']
        asset_id = row['asset_id']
        beneficiary_id = row['beneficiary_id']
        village_id = row['village_id']
        change_type = row['change_type']
        detection_date = row['detection_date']
        area_change_hectares = row['area_change_hectares']
        confidence_score = row['confidence_score']

        # Get title_id from asset inventory
        asset_details = df_asset[df_asset['asset_id'] == asset_id]
        title_id = asset_details['title_id'].iloc[0] if not asset_details.empty else 'Unknown'

        # Get right_type from FRA titles
        title_details = df_titles[df_titles['title_id'] == title_id]
        right_type = title_details['right_type'].iloc[0] if not title_details.empty else 'Unknown'

        # Determine geojson file based on right_type
        geo_file = None
        if 'IFR' in right_type.upper():
            geo_file = 'data/mock_fra_ifr_boundaries_mandla.geojson'
        elif 'CR' in right_type.upper():
            geo_file = 'data/mock_fra_cr_boundaries_mandla.geojson'
        elif 'CFR' in right_type.upper():
            geo_file = 'data/mock_fra_cfr_boundaries_mandla.geojson'

        # Load geojson if determined
        coordinates = None
        geo_data = None
        if geo_file:
            try:
                with open(geo_file, 'r') as f:
                    geo_data = json.load(f)
            except FileNotFoundError:
                pass

        if geo_data and 'features' in geo_data:
            for feature in geo_data['features']:
                props = feature.get('properties', {})
                if props.get('title_id') == title_id or props.get('beneficiary_id') == beneficiary_id or props.get('village_id') == village_id:
                    coordinates = feature.get('geometry', {}).get('coordinates')
                    break

        # Get village details
        village_details = df_admin[df_admin['village_id'] == village_id]
        village_name = village_details['village_name'].iloc[0] if not village_details.empty else 'Unknown'
        gp_name = village_details['gp_name'].iloc[0] if not village_details.empty else 'Unknown'
        block_name = village_details['block_name'].iloc[0] if not village_details.empty else 'Unknown'
        district = village_details['district'].iloc[0] if not village_details.empty else 'Unknown'
        state = village_details['state'].iloc[0] if not village_details.empty else 'Unknown'

        # Fallback to village coordinates
        if coordinates is None:
            if not village_details.empty:
                coordinates = [[village_details['longitude'].iloc[0], village_details['latitude'].iloc[0]]]
            else:
                coordinates = 'Not found'

        # JSON template for LLM output
        json_template = {
            "change_id": change_id,
            "change_type": change_type,
            "detection_date": detection_date,
            "area_change_hectares": area_change_hectares,
            "confidence_score": confidence_score,
            "beneficiary_id": beneficiary_id,
            "asset_id": asset_id,
            "title_id": title_id,
            "village_id": village_id,
            "village_name": village_name,
            "gp_name": gp_name,
            "block_name": block_name,
            "district": district,
            "state": state,
            "coordinates": coordinates,
            "risk_category": "",
            "description": ""
        }

        # Updated prompt for strict JSON output
        prompt = (
            f"Forest change detected: '{change_type}' ({area_change_hectares} hectares, {confidence_score} confidence) "
            f"on {detection_date} in {village_name}, {district}, {state}, India. "
            "Determine the risk category (High, Medium, Low) based on environmental impact. "
            "High risk means serious threat requiring urgent action (e.g., deforestation, encroachment). "
            "Medium risk means moderate impact (e.g., minor land alteration). "
            "Low risk means negligible impact (e.g., reforestation, crop harvesting). "
            "Provide the risk category and a one-line description of the change. "
            "Return the response as valid JSON in the following format, filling only the 'risk_category' and 'description' fields:\n"
            f"```json\n{json.dumps(json_template, indent=4, ensure_ascii=False)}\n```"
        )
        response = model.generate_content(prompt)
        # Strip code block markers and parse the JSON response
        response_text = response.text.strip()
        if response_text.startswith('```json') and response_text.endswith('```'):
            response_text = response_text[7:-3].strip()  # Remove ```json and ``` markers
        result = json.loads(response_text)
        results.append(result)

    return json.dumps(results, indent=4, ensure_ascii=False)

# Example usage (replace with actual API key)
# print(monitoring_agent("AIzaSyDVIEQJ3rbll37mQV4N0wRpbufqRBQLN4I", role="sdlc"))\\
    
    
    
# import pandas as pd
# import json
# import google.generativeai as genai

# class ResourceSuggestionAgent:
#     def __init__(self, model):
#         self.model = model

#     def monitoring_agent(self, model,role):

#         # Load the change detection data
#         try:
#             df_change = pd.read_csv('data/mock_temporal_change_detection_mandla.csv')
#         except FileNotFoundError:
#             print(f"Falling back to mock_data")
#             change_data = {
#                 'change_id': ['CHANGE_00000001'],
#                 'asset_id': ['ASSET_00018485'],
#                 'beneficiary_id': ['FRA_00007277'],
#                 'village_id': ['VIL_000363'],
#                 'detection_date': ['2020-12-11'],
#                 'change_type': ['Reforestation'],
#                 'area_change_hectares': [0.27],
#                 'confidence_score': [0.608],
#                 'detection_method': ['Landsat-8'],
#                 'verification_status': ['Pending'],
#                 'verification_date': ['2020-03-08'],
#                 'verified_by': [''],
#                 'impact_assessment': ['Positive'],
#                 'recommended_action': ['No_Action'],
#                 'notes': ['Detected via ML_Algorithm']
#             }
#             df_change = pd.DataFrame(change_data)

#         # Load the administrative hierarchy data
#         try:
#             df_admin = pd.read_csv('data/mock_administrative_hierarchy_mandla.csv')
#         except FileNotFoundError:
#             admin_data = {
#                 'village_id': ['VIL_000001'],
#                 'village_name': ['चिरमिरी'],
#                 'gp_id': ['GP_000001'],
#                 'gp_name': ['GP_फतेहपुर'],
#                 'block_id': ['BLK_000001'],
#                 'block_name': ['Mandla'],
#                 'district': ['Mandla'],
#                 'state': ['Madhya Pradesh'],
#                 'latitude': [22.220009],
#                 'longitude': [80.275029],
#                 'population': [957],
#                 'tribal_population': [172],
#                 'forest_area_hectares': [140.998070468603]
#             }
#             df_admin = pd.DataFrame(admin_data)

#         # Merge df_change with df_admin to add hierarchy details
#         df_change = df_change.merge(df_admin[['village_id', 'gp_id', 'gp_name', 'block_id', 'block_name', 'district']], on='village_id', how='left')

#         # Determine base values from the first row
#         if not df_change.empty:
#             base_gp_id = df_change['gp_id'].iloc[0]
#             base_block_id = df_change['block_id'].iloc[0]
#             base_district = df_change['district'].iloc[0]
#         else:
#             base_gp_id = base_block_id = base_district = None

#         # Filter based on role
#         if role == 'GramaSabha':
#             filtered = df_change[df_change['gp_id'] == base_gp_id].head(2)
#         elif role == 'sdlc':
#             all_block_ids = df_admin['block_id'].unique()
#             other_block_id = next((b for b in all_block_ids if b != base_block_id), base_block_id)
#             two_blocks = [base_block_id, other_block_id]
#             filtered = pd.concat([
#                 df_change[df_change['block_id'] == base_block_id].head(2),
#                 df_change[df_change['block_id'] == other_block_id].head(2)
#             ]).head(4)  # Total 4 entries, 2 per block
#         elif role == 'dlc':
#             all_block_ids = df_admin['block_id'].unique()
#             other_block_id = next((b for b in all_block_ids if b != base_block_id), base_block_id)
#             two_blocks = [base_block_id, other_block_id]
#             filtered = pd.concat([
#                 df_change[df_change['block_id'] == base_block_id].head(2),
#                 df_change[df_change['block_id'] == other_block_id].head(2)
#             ]).head(4)  # Total 4 entries, 2 per block
#         else:
#             filtered = df_change.head(5)

#         self.model = model
#         # Load asset inventory
#         try:
#             df_asset = pd.read_csv('data/mock_detailed_asset_inventory_mandla.csv')
#         except FileNotFoundError:
#             df_asset = pd.DataFrame(columns=['asset_id', 'title_id', 'beneficiary_id', 'village_id'])

#         # Load FRA titles
#         try:
#             df_titles = pd.read_csv('data/mock_fra_titles_mandla.csv')
#         except FileNotFoundError:
#             df_titles = pd.DataFrame(columns=['title_id', 'beneficiary_id', 'village_id', 'right_type'])

#         results = []
#         for index, row in filtered.iterrows():
#             change_id = row['change_id']
#             asset_id = row['asset_id']
#             beneficiary_id = row['beneficiary_id']
#             village_id = row['village_id']
#             change_type = row['change_type']
#             detection_date = row['detection_date']
#             area_change_hectares = row['area_change_hectares']
#             confidence_score = row['confidence_score']

#             # Get title_id from asset inventory
#             asset_details = df_asset[df_asset['asset_id'] == asset_id]
#             title_id = asset_details['title_id'].iloc[0] if not asset_details.empty else 'Unknown'

#             # Get right_type from FRA titles
#             title_details = df_titles[df_titles['title_id'] == title_id]
#             right_type = title_details['right_type'].iloc[0] if not title_details.empty else 'Unknown'

#             # Determine geojson file based on right_type
#             geo_file = None
#             if 'IFR' in right_type.upper():
#                 geo_file = 'data/mock_fra_ifr_boundaries_mandla.geojson'
#             elif 'CR' in right_type.upper():
#                 geo_file = 'data/mock_fra_cr_boundaries_mandla.geojson'
#             elif 'CFR' in right_type.upper():
#                 geo_file = 'data/mock_fra_cfr_boundaries_mandla.geojson'

#             # Load geojson if determined
#             coordinates = None
#             geo_data = None
#             if geo_file:
#                 try:
#                     with open(geo_file, 'r') as f:
#                         geo_data = json.load(f)
#                 except FileNotFoundError:
#                     pass

#             if geo_data and 'features' in geo_data:
#                 for feature in geo_data['features']:
#                     props = feature.get('properties', {})
#                     if props.get('title_id') == title_id or props.get('beneficiary_id') == beneficiary_id or props.get('village_id') == village_id:
#                         coordinates = feature.get('geometry', {}).get('coordinates')
#                         break

#             # Get village details
#             village_details = df_admin[df_admin['village_id'] == village_id]
#             village_name = village_details['village_name'].iloc[0] if not village_details.empty else 'Unknown'
#             gp_name = village_details['gp_name'].iloc[0] if not village_details.empty else 'Unknown'
#             block_name = village_details['block_name'].iloc[0] if not village_details.empty else 'Unknown'
#             district = village_details['district'].iloc[0] if not village_details.empty else 'Unknown'
#             state = village_details['state'].iloc[0] if not village_details.empty else 'Unknown'

#             # Fallback to village coordinates
#             if coordinates is None:
#                 if not village_details.empty:
#                     coordinates = [[village_details['longitude'].iloc[0], village_details['latitude'].iloc[0]]]
#                 else:
#                     coordinates = 'Not found'

#             # JSON template for LLM output
#             json_template = {
#                 "change_id": change_id,
#                 "change_type": change_type,
#                 "detection_date": detection_date,
#                 "area_change_hectares": area_change_hectares,
#                 "confidence_score": confidence_score,
#                 "beneficiary_id": beneficiary_id,
#                 "asset_id": asset_id,
#                 "title_id": title_id,
#                 "village_id": village_id,
#                 "village_name": village_name,
#                 "gp_name": gp_name,
#                 "block_name": block_name,
#                 "district": district,
#                 "state": state,
#                 "coordinates": coordinates,
#                 "risk_category": "",
#                 "description": ""
#             }

#             # Updated prompt for strict JSON output
#             prompt = (
#                 f"Forest change detected: '{change_type}' ({area_change_hectares} hectares, {confidence_score} confidence) "
#                 f"on {detection_date} in {village_name}, {district}, {state}, India. "
#                 "Determine the risk category (High, Medium, Low) based on environmental impact. "
#                 "High risk means serious threat requiring urgent action (e.g., deforestation, encroachment). "
#                 "Medium risk means moderate impact (e.g., minor land alteration). "
#                 "Low risk means negligible impact (e.g., reforestation, crop harvesting). "
#                 "Provide the risk category and a one-line description of the change. "
#                 "Return the response as valid JSON in the following format, filling only the 'risk_category' and 'description' fields:\n"
#                 f"```json\n{json.dumps(json_template, indent=4, ensure_ascii=False)}\n```"
#             )
#             response = self.model.generate_content(prompt)
#             # Strip code block markers and parse the JSON response
#             response_text = response.text.strip()
#             if response_text.startswith('```json') and response_text.endswith('```'):
#                 response_text = response_text[7:-3].strip()  # Remove ```json and ``` markers
#             result = json.loads(response_text)
#             results.append(result)

#         return json.dumps(results, indent=4, ensure_ascii=False)

# # Example usage (replace with actual API key)
# # print(monitoring_agent("AIzaSyDVIEQJ3rbll37mQV4N0wRpbufqRBQLN4I", role="sdlc"))