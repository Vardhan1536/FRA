import requests
import time

def test_backend_health():
    """Test the backend health endpoint"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is healthy!")
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"❌ Backend returned status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running or not accessible")
        return False
    except requests.exceptions.Timeout:
        print("❌ Backend health check timed out")
        return False
    except Exception as e:
        print(f"❌ Error checking backend health: {e}")
        return False

if __name__ == "__main__":
    print("Testing backend health...")
    test_backend_health()
