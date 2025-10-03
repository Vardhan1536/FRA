#!/usr/bin/env python3
"""
Test script for the monitoring API endpoint
"""

import requests
import json
import time

def test_monitoring_api():
    """Test the monitoring API endpoints"""
    
    base_url = "http://127.0.0.1:8000"
    
    print("Testing Monitoring API...")
    print("=" * 50)
    
    # Test 1: Get all alerts
    print("\n1. Testing GET /monitor-changes (get all alerts)")
    try:
        response = requests.get(f"{base_url}/monitor-changes", timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response Type: {type(data)}")
            if isinstance(data, list):
                print(f"Number of alerts: {len(data)}")
                if data:
                    print(f"Sample alert: {json.dumps(data[0], indent=2, default=str)}")
                else:
                    print("No alerts returned")
            else:
                print(f"Response: {json.dumps(data, indent=2, default=str)}")
        else:
            print(f"Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server. Make sure the backend is running on http://127.0.0.1:8000")
    except requests.exceptions.Timeout:
        print("Error: Request timed out")
    except Exception as e:
        print(f"Error: {str(e)}")
    
    # Test 2: Refresh change detection
    print("\n2. Testing POST /monitor-changes/refresh")
    try:
        response = requests.post(f"{base_url}/monitor-changes/refresh", 
                               json={}, 
                               headers={"Content-Type": "application/json"},
                               timeout=60)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Refresh response: {json.dumps(data, indent=2, default=str)}")
        else:
            print(f"Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server. Make sure the backend is running on http://127.0.0.1:8000")
    except requests.exceptions.Timeout:
        print("Error: Request timed out")
    except Exception as e:
        print(f"Error: {str(e)}")
    
    # Test 3: Test alert acknowledgment (if we have alerts)
    print("\n3. Testing alert acknowledgment")
    try:
        # First get alerts to see if we have any
        alerts_response = requests.get(f"{base_url}/monitor-changes", timeout=30)
        if alerts_response.status_code == 200:
            alerts = alerts_response.json()
            if isinstance(alerts, list) and alerts:
                alert_id = alerts[0].get('id', 'test-alert-id')
                print(f"Testing acknowledgment for alert ID: {alert_id}")
                
                response = requests.post(f"{base_url}/monitor-changes/{alert_id}/acknowledge",
                                       json={
                                           "comments": "Test acknowledgment from frontend",
                                           "acknowledgedAt": time.strftime("%Y-%m-%dT%H:%M:%S")
                                       },
                                       headers={"Content-Type": "application/json"},
                                       timeout=30)
                print(f"Status Code: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"Acknowledgment response: {json.dumps(data, indent=2, default=str)}")
                else:
                    print(f"Error: {response.text}")
            else:
                print("No alerts available for acknowledgment test")
        else:
            print("Could not fetch alerts for acknowledgment test")
            
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server. Make sure the backend is running on http://127.0.0.1:8000")
    except requests.exceptions.Timeout:
        print("Error: Request timed out")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_monitoring_api()
