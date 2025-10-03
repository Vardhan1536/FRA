#!/usr/bin/env python3
"""
Test script for Scheme Eligibility API
Tests the http://127.0.0.1:8000/get-scheme-eligibility endpoint
"""

import requests
import json
import time
from datetime import datetime

def test_scheme_eligibility_api():
    """Test the scheme eligibility API endpoint"""
    
    base_url = "http://127.0.0.1:8000"
    endpoint = f"{base_url}/get-scheme-eligibility"
    
    print("🧪 Testing Scheme Eligibility API")
    print("=" * 50)
    
    # Test different roles
    roles = ["SDLC", "DLC", "GramaSabha"]
    
    for role in roles:
        print(f"\n📋 Testing role: {role}")
        print("-" * 30)
        
        try:
            # Make API request
            params = {"role": role}
            response = requests.get(endpoint, params=params, timeout=30)
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Success! Received {len(data)} beneficiaries")
                
                # Display sample data structure
                if data:
                    sample = data[0]
                    print(f"\n📊 Sample Data Structure:")
                    print(f"  Beneficiary ID: {sample.get('beneficiary_id', 'N/A')}")
                    print(f"  Schemes Count: {len(sample.get('schemes_eligibility', []))}")
                    
                    # Show first scheme details
                    if sample.get('schemes_eligibility'):
                        first_scheme = sample['schemes_eligibility'][0]
                        print(f"\n  First Scheme:")
                        print(f"    Name: {first_scheme.get('scheme_name', 'N/A')}")
                        print(f"    Eligibility: {first_scheme.get('eligibility', 'N/A')}")
                        print(f"    Reasons Count: {len(first_scheme.get('reasons', []))}")
                        
                        if first_scheme.get('reasons'):
                            print(f"    First Reason: {first_scheme['reasons'][0][:100]}...")
                
                # Calculate statistics
                total_beneficiaries = len(data)
                total_schemes = set()
                eligible_count = 0
                ineligible_count = 0
                
                for beneficiary in data:
                    for scheme in beneficiary.get('schemes_eligibility', []):
                        total_schemes.add(scheme.get('scheme_name', ''))
                        if scheme.get('eligibility'):
                            eligible_count += 1
                        else:
                            ineligible_count += 1
                
                print(f"\n📈 Statistics:")
                print(f"  Total Beneficiaries: {total_beneficiaries}")
                print(f"  Total Schemes: {len(total_schemes)}")
                print(f"  Total Eligibility Checks: {eligible_count + ineligible_count}")
                print(f"  Eligible: {eligible_count}")
                print(f"  Ineligible: {ineligible_count}")
                
                if eligible_count + ineligible_count > 0:
                    eligibility_rate = (eligible_count / (eligible_count + ineligible_count)) * 100
                    print(f"  Overall Eligibility Rate: {eligibility_rate:.1f}%")
                
                # Show scheme breakdown
                print(f"\n📋 Scheme Breakdown:")
                scheme_stats = {}
                for beneficiary in data:
                    for scheme in beneficiary.get('schemes_eligibility', []):
                        scheme_name = scheme.get('scheme_name', 'Unknown')
                        if scheme_name not in scheme_stats:
                            scheme_stats[scheme_name] = {'eligible': 0, 'ineligible': 0}
                        
                        if scheme.get('eligibility'):
                            scheme_stats[scheme_name]['eligible'] += 1
                        else:
                            scheme_stats[scheme_name]['ineligible'] += 1
                
                for scheme_name, stats in scheme_stats.items():
                    total = stats['eligible'] + stats['ineligible']
                    rate = (stats['eligible'] / total * 100) if total > 0 else 0
                    print(f"  {scheme_name}: {stats['eligible']}/{total} ({rate:.1f}%)")
                
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"Response: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {e}")
        except json.JSONDecodeError as e:
            print(f"❌ JSON decode error: {e}")
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
        
        print()
    
    print("🏁 Test completed!")

def test_api_performance():
    """Test API performance with multiple requests"""
    
    print("\n⚡ Performance Test")
    print("=" * 30)
    
    endpoint = "http://127.0.0.1:8000/get-scheme-eligibility"
    role = "DLC"
    
    # Test multiple requests
    num_requests = 5
    times = []
    
    for i in range(num_requests):
        start_time = time.time()
        try:
            response = requests.get(endpoint, params={"role": role}, timeout=30)
            end_time = time.time()
            
            if response.status_code == 200:
                duration = end_time - start_time
                times.append(duration)
                print(f"Request {i+1}: {duration:.2f}s ({response.status_code})")
            else:
                print(f"Request {i+1}: Failed ({response.status_code})")
                
        except Exception as e:
            print(f"Request {i+1}: Error - {e}")
    
    if times:
        avg_time = sum(times) / len(times)
        min_time = min(times)
        max_time = max(times)
        
        print(f"\n📊 Performance Summary:")
        print(f"  Average Response Time: {avg_time:.2f}s")
        print(f"  Fastest Response: {min_time:.2f}s")
        print(f"  Slowest Response: {max_time:.2f}s")
        print(f"  Success Rate: {len(times)}/{num_requests} ({len(times)/num_requests*100:.1f}%)")

if __name__ == "__main__":
    print(f"🚀 Starting Scheme Eligibility API Tests")
    print(f"⏰ Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Test basic functionality
    test_scheme_eligibility_api()
    
    # Test performance
    test_api_performance()
    
    print(f"\n✅ All tests completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
