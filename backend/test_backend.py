import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"
EMAIL = "test@loop.ai"
PASSWORD = "password123"

def run_test():
    print("🚀 Starting Backend Integration Test...\n")

    # 1. Register
    print("1️⃣  Registering User...")
    try:
        resp = requests.post(f"{BASE_URL}/auth/register", json={"email": EMAIL, "password": PASSWORD})
        if resp.status_code == 200:
            print("   ✅ User created!")
        elif resp.status_code == 400:
            print("   ⚠️ User already exists (skipping registration).")
        else:
            print(f"   ❌ Registration failed: {resp.text}")
            return
    except Exception as e:
        print(f"   ❌ Is the server running? Error: {e}")
        return

    # 2. Login
    print("\n2️⃣  Logging in...")
    resp = requests.post(f"{BASE_URL}/auth/login", data={"username": EMAIL, "password": PASSWORD})
    if resp.status_code != 200:
        print(f"   ❌ Login failed: {resp.text}")
        return
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("   ✅ Login successful! Token acquired.")

    # 3. Create Organization
    print("\n3️⃣  Creating Organization...")
    resp = requests.post(f"{BASE_URL}/orgs/", headers=headers, json={"name": "Test Corp", "slug": "test-corp"})
    if resp.status_code == 200:
        org_id = resp.json()["_id"]
        print(f"   ✅ Organization 'Test Corp' created! ID: {org_id}")
    else:
        # Assuming org might already exist, let's fetch 'me' to get the ID
        user_resp = requests.get(f"{BASE_URL}/auth/me", headers=headers) # This endpoint might not exist, checking alternative
        # Actually, let's just get the org from the /orgs/me endpoint we built
        org_resp = requests.get(f"{BASE_URL}/orgs/me", headers=headers)
        if org_resp.status_code == 200:
             org_id = org_resp.json()["_id"]
             print(f"   ⚠️ Org already exists. Using ID: {org_id}")
        else:
             print(f"   ❌ Failed to get Org ID: {resp.text}")
             return

    # 4. Simulate GitHub Webhook (The "Ears")
    print(f"\n4️⃣  Sending Fake GitHub Event to /webhooks/github/{org_id}...")
    
    fake_github_payload = {
        "action": "opened",
        "sender": {"login": "ayush-dev"},
        "repository": {"full_name": "ayush/backend-api"},
        "pull_request": {
            "number": 101,
            "title": "Update Payment Gateway",
            "state": "open",
            "html_url": "http://github.com/ayush/backend-api/pull/101",
            "diff_url": "http://github.com/ayush/backend-api/pull/101.diff",
            "body": "Changed the payment provider API key handling. Hardcoded the key for now to test fast." # <--- RISKY!
        }
    }
    
    # We send this with a special header Github uses
    webhook_headers = {"X-GitHub-Event": "pull_request"}
    
    resp = requests.post(f"{BASE_URL}/webhooks/github/{org_id}", json=fake_github_payload, headers=webhook_headers)
    
    if resp.status_code == 200:
        print("   ✅ Webhook received successfully!")
        print("\n🎉 TEST COMPLETE! Now check your Server Terminal.")
        print("   You should see:")
        print("   1. '✅ Parsed GitHub Event'")
        print("   2. '🧠 AI Analyzing...'")
        print("   3. '✅ Alert sent to Slack!' (If Slack was configured, otherwise it just prints logic)")
    else:
        print(f"   ❌ Webhook failed: {resp.text}")

if __name__ == "__main__":
    run_test()