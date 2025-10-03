# Backend Connection Guide

## Setup Instructions

### 1. Start your FastAPI Backend
```bash
cd Backend/Connection
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start your Frontend
```bash
cd project
npm run dev -- --port 5174
```

### 3. Test Authentication

#### Option A: Test Backend Authentication First
```bash
cd project
python test_auth.py
```

#### Option B: Test Frontend Authentication
1. Open your browser and go to `http://localhost:5174`
2. Login with any of these credentials:
   - **Grama Sabha**: `gramasabha@demo.com` / `password`
   - **Grama Sabha**: `gramasabha@fra.gov.in` / `gs123`
   - **SDLC**: `sdlc@fra.gov.in` / `sdlc123`
   - **DLC**: `dlc@fra.gov.in` / `dlc123`
3. Navigate to the Claims page (for Grama Sabha role)

### 4. Test File Upload
1. On the Claims page, you'll see two upload sections:
   - **Upload FRA Titles (Old Claimants)**: Upload your `fra_titles.csv` file
   - **Upload FRA Beneficiaries (New Applicants)**: Upload your `fra_beneficiaries.csv` file

2. After uploading, the data will be displayed in the respective sections below

### 5. API Endpoints
Your FastAPI backend exposes these endpoints:
- `POST /gramsabha/upload/titles` - Upload FRA titles CSV
- `POST /gramsabha/upload/beneficiaries` - Upload FRA beneficiaries CSV  
- `GET /gramsabha/claimants?limit=50` - Get FRA titles data (default: top 50 records)
- `GET /gramsabha/applicants?limit=50` - Get FRA beneficiaries data (default: top 50 records)
- `POST /login` - Authentication endpoint

**Note:** The claimants and applicants endpoints are limited to 50 records by default for performance. You can adjust the limit by adding `?limit=N` to the URL.

### 6. Troubleshooting

#### CORS Issues
If you encounter CORS errors, make sure your FastAPI server includes the CORS middleware (already added).

#### Authentication Issues
- Make sure you're logged in with the correct credentials:
  - **Grama Sabha**: `gramasabha@demo.com` / `password` OR `gramasabha@fra.gov.in` / `gs123`
  - **SDLC**: `sdlc@fra.gov.in` / `sdlc123`
  - **DLC**: `dlc@fra.gov.in` / `dlc123`
- Check browser console for authentication errors and API request/response logs
- Verify the JWT token is being stored in localStorage (check browser dev tools)
- Run the test script: `python test_auth.py` to verify backend authentication
- Check FastAPI server logs for authentication debugging information
- Make sure you're using the Grama Sabha role for accessing the Claims page

#### File Upload Issues
- Check that your CSV files have the correct column headers
- Verify file size is reasonable
- Check backend logs for any processing errors

#### Data Display Issues
- Check browser console for API response errors
- Verify the CSV data structure matches the expected format
- Check that files were uploaded successfully to the backend

### 7. CSV File Format

#### FRA Titles CSV should have columns:
```
title_id,beneficiary_id,village_id,right_type,status,area_hectares,application_date,approval_date,survey_number,gps_coordinates,forest_division,forest_range,forest_beat,gram_sabha_resolution_date,sdlc_recommendation_date,dlc_approval_date,title_deed_number,remarks
```

#### FRA Beneficiaries CSV should have columns:
```
beneficiary_id,village_id,village_name,gp_id,block_id,district,state,first_name,last_name,father_husband_name,gender,age,tribal_community,family_size,annual_income,education_level,occupation,aadhaar_number,mobile_number,bank_account,ifsc_code,created_date,updated_date
```

### 8. Development Notes
- The authentication system uses simple base64-encoded tokens for development
- In production, implement proper JWT with HMAC-SHA256 signatures
- The backend saves uploaded files as `fra_titles.csv` and `fra_beneficiaries.csv` in the `data` directory
- All API responses include proper error handling and logging
