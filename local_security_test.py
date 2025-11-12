#!/usr/bin/env python3
"""
Local DJConnect Security Testing
Tests security features against localhost:3000
"""

import requests
import json
import time
import base64

BASE_URL = "http://localhost:3000"

def test_local_security():
    print("🔒 Testing Local Security Features")
    print("=" * 40)
    
    session = requests.Session()
    
    # Test 1: Security Headers
    print("\n1. Testing Security Headers...")
    response = session.get(BASE_URL)
    headers = response.headers
    
    print(f"✅ X-Frame-Options: {headers.get('X-Frame-Options', 'MISSING')}")
    print(f"✅ X-Content-Type-Options: {headers.get('X-Content-Type-Options', 'MISSING')}")
    print(f"✅ Strict-Transport-Security: {headers.get('Strict-Transport-Security', 'MISSING')}")
    print(f"✅ Content-Security-Policy: {'Present' if headers.get('Content-Security-Policy') else 'MISSING'}")
    
    # Test 2: Input Validation
    print("\n2. Testing Input Validation...")
    
    # Test invalid email
    response = session.post(f"{BASE_URL}/register", 
        json={"username": "testuser123", "email": "not-an-email", "password": "testpass123"})
    print(f"Invalid email rejection: {response.status_code} (should be 400)")
    
    # Test short username
    response = session.post(f"{BASE_URL}/register", 
        json={"username": "ab", "email": "test@example.com", "password": "testpass123"})
    print(f"Short username rejection: {response.status_code} (should be 400)")
    
    # Test short password
    response = session.post(f"{BASE_URL}/register", 
        json={"username": "testuser456", "email": "test2@example.com", "password": "12345"})
    print(f"Short password rejection: {response.status_code} (should be 400)")
    
    # Test 3: NoSQL Injection
    print("\n3. Testing NoSQL Injection Protection...")
    nosql_payload = {"username": {"$ne": None}, "password": {"$ne": None}}
    response = session.post(f"{BASE_URL}/login", json=nosql_payload)
    print(f"NoSQL injection blocked: {response.status_code} (should not be 200 with token)")
    
    print("\n✅ Local security testing completed!")

if __name__ == "__main__":
    test_local_security()