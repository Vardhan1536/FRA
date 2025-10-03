#!/usr/bin/env python3
"""
Simple test script to verify authentication with your FastAPI backend
Run this after starting your FastAPI server to test the login endpoint
"""

import requests
import json
import base64

# Configuration
API_BASE_URL = "http://127.0.0.1:8000"

# Test multiple credentials
TEST_CREDENTIALS = [
    {"username": "gramasabha@demo.com", "password": "password", "expected_role": "GRAMSABHA"},
    {"username": "gramasabha@fra.gov.in", "password": "gs123", "expected_role": "GRAMSABHA"},
    {"username": "sdlc@fra.gov.in", "password": "sdlc123", "expected_role": "SDLC"},
    {"username": "dlc@fra.gov.in", "password": "dlc123", "expected_role": "DLC"}
]

def test_login(credential):
    """Test the login endpoint with specific credentials"""
    username = credential["username"]
    password = credential["password"]
    expected_role = credential["expected_role"]
    
    print(f"Testing login for {username} (expected role: {expected_role})...")
    
    try:
        # Test login
        login_data = {
            'username': username,
            'password': password
        }
        
        response = requests.post(f"{API_BASE_URL}/login", data=login_data)
        
        if response.status_code == 200:
            print(f"✅ Login successful for {username}!")
            token_data = response.json()
            print(f"Token: {token_data['access_token'][:50]}...")
            
            # Test token decoding
            try:
                decoded = json.loads(base64.b64decode(token_data['access_token'] + '==').decode('utf-8'))
                print(f"Decoded token: {decoded}")
                
                # Verify role matches
                if decoded.get('role') == expected_role:
                    print(f"✅ Role verification successful: {decoded.get('role')}")
                else:
                    print(f"❌ Role mismatch: expected {expected_role}, got {decoded.get('role')}")
                
                return token_data['access_token']
            except Exception as e:
                print(f"❌ Token decoding failed: {e}")
                return None
        else:
            print(f"❌ Login failed for {username}: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Login request failed for {username}: {e}")
        return None

def test_protected_endpoint(token):
    """Test a protected endpoint with the token"""
    if not token:
        print("❌ No token available for testing")
        return
        
    print("\nTesting protected endpoint...")
    
    try:
        headers = {
            'Authorization': f'Bearer {token}'
        }
        
        response = requests.get(f"{API_BASE_URL}/gramsabha/claimants", headers=headers)
        
        if response.status_code == 200:
            print("✅ Protected endpoint accessible!")
            data = response.json()
            print(f"Response: {data}")
        elif response.status_code == 404:
            print("✅ Authentication successful, but no CSV file found (expected)")
        else:
            print(f"❌ Protected endpoint failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Protected endpoint request failed: {e}")

if __name__ == "__main__":
    print("🔐 Testing FastAPI Authentication")
    print("=" * 50)
    
    # Test all credentials
    for i, credential in enumerate(TEST_CREDENTIALS):
        print(f"\n--- Test {i+1}: {credential['username']} ---")
        token = test_login(credential)
        if token and credential["expected_role"] == "GRAMSABHA":
            test_protected_endpoint(token)
        print("-" * 40)
    
    print("\n" + "=" * 50)
    print("All tests completed!")
