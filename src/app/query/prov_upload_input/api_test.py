import requests
import json
import os

# Configuration from your C++ defaults
url = "http://localhost:3000/api/public/upload-activity"
pat = "392ae60a453d2a42afe7d2790091491ae79a3116255ddab9d81a319204a24fc1f2f286d0136df8aa61a46ba63b2424bccb07d02214116f23afd35698c118af12" # Replace this
# This is fine this pat is only valid on my machine (replace with yours?)
json_file_path = "fixtures/tmp/prov_upload_input/file_ops.json" 

# 2. Load the JSON file
if not os.path.exists(json_file_path):
    print(f"Error: {json_file_path} not found.")
    exit(1)

with open(json_file_path, 'r') as f:
    try:
        payload = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: Failed to parse JSON file: {e}")
        exit(1)


headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {pat}"
}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Response Body:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Connection failed: {e}")