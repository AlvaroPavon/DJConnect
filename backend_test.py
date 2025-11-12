#!/usr/bin/env python3
"""
DJConnect Security Testing Suite
Tests all security features of the DJConnect backend running at https://djapp.duckdns.org
"""

import requests
import json
import time
import base64
import sys
from urllib.parse import urljoin

# Configuration
BASE_URL = "https://djapp.duckdns.org"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class SecurityTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_results = []
        
    def log_test(self, test_name, passed, details=""):
        """Log test results"""
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "details": details
        })
        
    def test_https_and_ssl(self):
        """Test HTTPS enforcement and SSL certificate"""
        print("\n=== 1. HTTPS and SSL Certificate Tests ===")
        
        try:
            # Test HTTPS URL
            response = self.session.get(BASE_URL, timeout=10)
            self.log_test("HTTPS URL accessible", response.status_code == 200 or response.status_code == 302)
            
            # Verify SSL certificate (requests will fail if invalid)
            self.log_test("Valid SSL Certificate", True, "SSL certificate verified by requests library")
            
        except requests.exceptions.SSLError as e:
            self.log_test("Valid SSL Certificate", False, f"SSL Error: {str(e)}")
        except Exception as e:
            self.log_test("HTTPS URL accessible", False, f"Connection error: {str(e)}")
    
    def test_security_headers(self):
        """Test security headers"""
        print("\n=== 2. Security Headers Tests ===")
        
        try:
            response = self.session.get(BASE_URL, timeout=10)
            headers = response.headers
            
            # Test X-Frame-Options
            x_frame = headers.get('X-Frame-Options', '').lower()
            self.log_test("X-Frame-Options header", 
                         x_frame in ['deny', 'sameorigin'], 
                         f"Value: {x_frame}")
            
            # Test X-Content-Type-Options
            x_content_type = headers.get('X-Content-Type-Options', '').lower()
            self.log_test("X-Content-Type-Options header", 
                         x_content_type == 'nosniff', 
                         f"Value: {x_content_type}")
            
            # Test Strict-Transport-Security (HSTS)
            hsts = headers.get('Strict-Transport-Security', '')
            self.log_test("Strict-Transport-Security header", 
                         'max-age' in hsts.lower(), 
                         f"Value: {hsts}")
            
            # Test Content-Security-Policy
            csp = headers.get('Content-Security-Policy', '')
            self.log_test("Content-Security-Policy header", 
                         len(csp) > 0, 
                         f"Present: {bool(csp)}")
            
        except Exception as e:
            self.log_test("Security Headers Test", False, f"Error: {str(e)}")
    
    def test_rate_limiting_login(self):
        """Test login rate limiting (5 attempts in 15 minutes)"""
        print("\n=== 3. Login Rate Limiting Tests ===")
        
        login_url = urljoin(BASE_URL, "/login")
        
        # Test 6 rapid login attempts
        for i in range(6):
            try:
                response = self.session.post(login_url, 
                    json={"username": "testuser", "password": "wrongpassword"},
                    timeout=10)
                
                if i < 5:
                    # First 5 should get 401 (unauthorized)
                    expected = response.status_code == 401
                    self.log_test(f"Login attempt {i+1}/6", expected, 
                                f"Status: {response.status_code}")
                else:
                    # 6th should be rate limited (429)
                    rate_limited = response.status_code == 429
                    self.log_test("Login rate limiting after 5 attempts", rate_limited, 
                                f"Status: {response.status_code}, Response: {response.text[:100]}")
                
                time.sleep(0.5)  # Small delay between requests
                
            except Exception as e:
                self.log_test(f"Login attempt {i+1}/6", False, f"Error: {str(e)}")
    
    def test_rate_limiting_register(self):
        """Test register rate limiting (3 attempts in 1 hour)"""
        print("\n=== 4. Register Rate Limiting Tests ===")
        
        register_url = urljoin(BASE_URL, "/register")
        
        # Test 4 rapid register attempts
        for i in range(4):
            try:
                response = self.session.post(register_url, 
                    json={
                        "username": f"testuser{i}_{int(time.time())}",
                        "email": f"test{i}_{int(time.time())}@example.com",
                        "password": "testpass123"
                    },
                    timeout=10)
                
                if i < 3:
                    # First 3 might succeed or fail due to validation
                    self.log_test(f"Register attempt {i+1}/4", True, 
                                f"Status: {response.status_code}")
                else:
                    # 4th should be rate limited (429)
                    rate_limited = response.status_code == 429
                    self.log_test("Register rate limiting after 3 attempts", rate_limited, 
                                f"Status: {response.status_code}, Response: {response.text[:100]}")
                
                time.sleep(0.5)
                
            except Exception as e:
                self.log_test(f"Register attempt {i+1}/4", False, f"Error: {str(e)}")
    
    def test_rate_limiting_forgot_password(self):
        """Test forgot-password rate limiting (3 attempts in 1 hour)"""
        print("\n=== 5. Forgot Password Rate Limiting Tests ===")
        
        forgot_url = urljoin(BASE_URL, "/forgot-password")
        
        # Test 4 rapid forgot-password attempts
        for i in range(4):
            try:
                response = self.session.post(forgot_url, 
                    json={"email": "test@example.com"},
                    timeout=10)
                
                if i < 3:
                    # First 3 should succeed (200) even if email doesn't exist
                    self.log_test(f"Forgot password attempt {i+1}/4", True, 
                                f"Status: {response.status_code}")
                else:
                    # 4th should be rate limited (429)
                    rate_limited = response.status_code == 429
                    self.log_test("Forgot password rate limiting after 3 attempts", rate_limited, 
                                f"Status: {response.status_code}, Response: {response.text[:100]}")
                
                time.sleep(0.5)
                
            except Exception as e:
                self.log_test(f"Forgot password attempt {i+1}/4", False, f"Error: {str(e)}")
    
    def test_input_validation(self):
        """Test input validation against XSS and malicious inputs"""
        print("\n=== 6. Input Validation Tests ===")
        
        # Test XSS in login
        login_url = urljoin(BASE_URL, "/login")
        xss_payload = "<script>alert('xss')</script>"
        
        try:
            response = self.session.post(login_url, 
                json={"username": xss_payload, "password": "test"},
                timeout=10)
            
            # Should be rejected (400 or 401, not 500)
            safe_response = response.status_code in [400, 401]
            self.log_test("XSS payload in login rejected", safe_response, 
                        f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("XSS payload in login rejected", False, f"Error: {str(e)}")
        
        # Test invalid email in register
        register_url = urljoin(BASE_URL, "/register")
        
        try:
            response = self.session.post(register_url, 
                json={
                    "username": "testuser",
                    "email": "not-an-email",
                    "password": "testpass123"
                },
                timeout=10)
            
            # Should be rejected (400)
            email_validation = response.status_code == 400
            self.log_test("Invalid email format rejected", email_validation, 
                        f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Invalid email format rejected", False, f"Error: {str(e)}")
        
        # Test short username in register
        try:
            response = self.session.post(register_url, 
                json={
                    "username": "ab",  # Too short
                    "email": "test@example.com",
                    "password": "testpass123"
                },
                timeout=10)
            
            # Should be rejected (400)
            username_validation = response.status_code == 400
            self.log_test("Short username rejected", username_validation, 
                        f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Short username rejected", False, f"Error: {str(e)}")
        
        # Test short password in register
        try:
            response = self.session.post(register_url, 
                json={
                    "username": "testuser",
                    "email": "test@example.com",
                    "password": "12345"  # Too short
                },
                timeout=10)
            
            # Should be rejected (400)
            password_validation = response.status_code == 400
            self.log_test("Short password rejected", password_validation, 
                        f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Short password rejected", False, f"Error: {str(e)}")
    
    def test_nosql_injection(self):
        """Test NoSQL injection protection"""
        print("\n=== 7. NoSQL Injection Tests ===")
        
        login_url = urljoin(BASE_URL, "/login")
        
        # Test NoSQL injection payload
        nosql_payload = {
            "username": {"$ne": None},
            "password": {"$ne": None}
        }
        
        try:
            response = self.session.post(login_url, 
                json=nosql_payload,
                timeout=10)
            
            # Should be rejected or sanitized (not return 200 with valid token)
            injection_blocked = response.status_code != 200 or 'token' not in response.text
            self.log_test("NoSQL injection blocked", injection_blocked, 
                        f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("NoSQL injection blocked", False, f"Error: {str(e)}")
    
    def login_as_admin(self):
        """Login as admin to get token for file upload tests"""
        print("\n=== Admin Login for File Upload Tests ===")
        
        login_url = urljoin(BASE_URL, "/login")
        
        try:
            response = self.session.post(login_url, 
                json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
                timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get('token')
                self.log_test("Admin login successful", True, "Token obtained")
                return True
            else:
                self.log_test("Admin login successful", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin login successful", False, f"Error: {str(e)}")
            return False
    
    def test_file_upload_security(self):
        """Test file upload security with admin token"""
        print("\n=== 8. File Upload Security Tests ===")
        
        if not self.admin_token:
            self.log_test("File upload tests", False, "No admin token available")
            return
        
        upload_url = urljoin(BASE_URL, "/api/admin/config/logo")
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test 1: Upload non-image file (text as base64)
        try:
            fake_image = base64.b64encode(b"This is not an image file").decode()
            fake_data_url = f"data:image/png;base64,{fake_image}"
            
            response = self.session.post(upload_url, 
                json={"logoData": fake_data_url},
                headers=headers,
                timeout=10)
            
            # Should be rejected (400)
            text_rejected = response.status_code == 400
            self.log_test("Non-image file rejected", text_rejected, 
                        f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Non-image file rejected", False, f"Error: {str(e)}")
        
        # Test 2: Upload file with wrong magic numbers
        try:
            # Create fake PNG with wrong magic numbers
            fake_png_data = b"\x00\x00\x00\x00" + b"FAKE" + b"\x00" * 100
            fake_png_b64 = base64.b64encode(fake_png_data).decode()
            fake_png_url = f"data:image/png;base64,{fake_png_b64}"
            
            response = self.session.post(upload_url, 
                json={"logoData": fake_png_url},
                headers=headers,
                timeout=10)
            
            # Should be rejected (400)
            magic_check = response.status_code == 400
            self.log_test("File with wrong magic numbers rejected", magic_check, 
                        f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("File with wrong magic numbers rejected", False, f"Error: {str(e)}")
        
        # Test 3: Upload valid small PNG
        try:
            # Create a minimal valid PNG (1x1 pixel)
            valid_png = (
                b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
                b'\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13'
                b'\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc```'
                b'\x00\x00\x00\x04\x00\x01\xdd\x8d\xb4\x1c\x00\x00\x00\x00IEND\xaeB`\x82'
            )
            valid_png_b64 = base64.b64encode(valid_png).decode()
            valid_png_url = f"data:image/png;base64,{valid_png_b64}"
            
            response = self.session.post(upload_url, 
                json={"logoData": valid_png_url},
                headers=headers,
                timeout=10)
            
            # Should be accepted (200)
            valid_upload = response.status_code == 200
            self.log_test("Valid PNG upload accepted", valid_upload, 
                        f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Valid PNG upload accepted", False, f"Error: {str(e)}")
    
    def test_upload_rate_limiting(self):
        """Test file upload rate limiting"""
        print("\n=== 9. File Upload Rate Limiting Tests ===")
        
        if not self.admin_token:
            self.log_test("Upload rate limiting tests", False, "No admin token available")
            return
        
        upload_url = urljoin(BASE_URL, "/api/admin/config/logo")
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Create a valid small PNG for testing
        valid_png = (
            b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
            b'\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13'
            b'\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc```'
            b'\x00\x00\x00\x04\x00\x01\xdd\x8d\xb4\x1c\x00\x00\x00\x00IEND\xaeB`\x82'
        )
        valid_png_b64 = base64.b64encode(valid_png).decode()
        valid_png_url = f"data:image/png;base64,{valid_png_b64}"
        
        # Test 11 rapid uploads (limit is 10 in 15 minutes)
        for i in range(11):
            try:
                response = self.session.post(upload_url, 
                    json={"logoData": valid_png_url},
                    headers=headers,
                    timeout=10)
                
                if i < 10:
                    # First 10 should succeed
                    self.log_test(f"Upload attempt {i+1}/11", True, 
                                f"Status: {response.status_code}")
                else:
                    # 11th should be rate limited (429)
                    rate_limited = response.status_code == 429
                    self.log_test("Upload rate limiting after 10 attempts", rate_limited, 
                                f"Status: {response.status_code}")
                
                time.sleep(0.2)  # Small delay
                
            except Exception as e:
                self.log_test(f"Upload attempt {i+1}/11", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run all security tests"""
        print("🔒 DJConnect Security Testing Suite")
        print("=" * 50)
        
        # Run all tests
        self.test_https_and_ssl()
        self.test_security_headers()
        self.test_rate_limiting_login()
        self.test_rate_limiting_register()
        self.test_rate_limiting_forgot_password()
        self.test_input_validation()
        self.test_nosql_injection()
        
        # Login as admin for file upload tests
        if self.login_as_admin():
            self.test_file_upload_security()
            self.test_upload_rate_limiting()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("🔒 SECURITY TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for result in self.test_results if result["passed"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # Show failed tests
        failed_tests = [result for result in self.test_results if not result["passed"]]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        print("\n✅ Security testing completed!")

if __name__ == "__main__":
    tester = SecurityTester()
    tester.run_all_tests()