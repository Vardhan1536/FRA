#!/usr/bin/env python3
"""
Test script for the legal assistance API endpoint
"""

import requests
import json

def test_legal_assistance_api():
    """Test the legal assistance API endpoint"""
    
    # Test data
    test_cases = [
        {
            "query": "What is the Forest Rights Act?",
            "role": "GramaSabha"
        },
        {
            "query": "How do I file a land claim?",
            "role": "SDLC"
        },
        {
            "query": "What documents are required for IFR claims?",
            "role": "DLC"
        }
    ]
    
    base_url = "http://127.0.0.1:8000"
    endpoint = "/legal-assistance"
    
    print("Testing Legal Assistance API...")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest Case {i}:")
        print(f"Query: {test_case['query']}")
        print(f"Role: {test_case['role']}")
        
        try:
            response = requests.post(
                f"{base_url}{endpoint}",
                json=test_case,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Response: {data.get('response', data.get('message', 'No response text'))}")
            else:
                print(f"Error: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("Error: Could not connect to the server. Make sure the backend is running on http://127.0.0.1:8000")
        except requests.exceptions.Timeout:
            print("Error: Request timed out")
        except Exception as e:
            print(f"Error: {str(e)}")
        
        print("-" * 30)

if __name__ == "__main__":
    test_legal_assistance_api()
