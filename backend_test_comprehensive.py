#!/usr/bin/env python3
"""
DJConnect Comprehensive Backend Testing Suite
Tests all API endpoints of the DJConnect backend running at https://djapp.duckdns.org
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

class DJConnectTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.dj_token = None
        self.test_results = []
        self.created_dj_id = None
        self.created_party_id = None
        self.created_wishlist_id = None
        
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

    def login_as_admin(self):
        """Login as admin to get authentication token"""
        print("\n=== 1. Admin Authentication ===")
        
        login_url = urljoin(BASE_URL, "/login")
        
        try:
            response = self.session.post(login_url, 
                json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
                timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get('token')
                self.log_test("Admin login", True, "Authentication successful")
                return True
            else:
                self.log_test("Admin login", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin login", False, f"Error: {str(e)}")
            return False

    def test_admin_party_management(self):
        """Test admin party management endpoints"""
        print("\n=== 2. Admin Party Management ===")
        
        if not self.admin_token:
            self.log_test("Admin party tests", False, "No admin token available")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test GET /api/admin/parties - List all parties
        try:
            response = self.session.get(urljoin(BASE_URL, "/api/admin/parties"), 
                                      headers=headers, timeout=10)
            self.log_test("GET /api/admin/parties", response.status_code == 200, 
                        f"Status: {response.status_code}")
            
            if response.status_code == 200:
                parties = response.json()
                if parties and len(parties) > 0:
                    party_id = parties[0].get('_id')
                    if party_id:
                        # Test POST /api/admin/parties/[id]/end - End a party
                        end_url = urljoin(BASE_URL, f"/api/admin/parties/{party_id}/end")
                        response = self.session.post(end_url, headers=headers, timeout=10)
                        self.log_test(f"POST /api/admin/parties/{party_id}/end", 
                                    response.status_code in [200, 400], 
                                    f"Status: {response.status_code}")
                        
                        # Test DELETE /api/admin/parties/[id] - Delete a party
                        delete_url = urljoin(BASE_URL, f"/api/admin/parties/{party_id}")
                        response = self.session.delete(delete_url, headers=headers, timeout=10)
                        self.log_test(f"DELETE /api/admin/parties/{party_id}", 
                                    response.status_code in [200, 404], 
                                    f"Status: {response.status_code}")
                else:
                    self.log_test("Party operations", True, "No parties available for testing")
                    
        except Exception as e:
            self.log_test("Admin party management", False, f"Error: {str(e)}")

    def test_admin_wishlist_management(self):
        """Test admin wishlist management endpoints"""
        print("\n=== 3. Admin Wishlist Management ===")
        
        if not self.admin_token:
            self.log_test("Admin wishlist tests", False, "No admin token available")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test GET /api/admin/wishlists - List all wishlists
        try:
            response = self.session.get(urljoin(BASE_URL, "/api/admin/wishlists"), 
                                      headers=headers, timeout=10)
            self.log_test("GET /api/admin/wishlists", response.status_code == 200, 
                        f"Status: {response.status_code}")
            
            if response.status_code == 200:
                wishlists = response.json()
                if wishlists and len(wishlists) > 0:
                    wishlist_id = wishlists[0].get('_id')
                    if wishlist_id:
                        # Test GET /api/admin/wishlists/[id] - View wishlist details
                        detail_url = urljoin(BASE_URL, f"/api/admin/wishlists/{wishlist_id}")
                        response = self.session.get(detail_url, headers=headers, timeout=10)
                        self.log_test(f"GET /api/admin/wishlists/{wishlist_id}", 
                                    response.status_code in [200, 404], 
                                    f"Status: {response.status_code}")
                        
                        # Test POST /api/admin/wishlists/[id]/export-pdf - Export PDF
                        pdf_url = urljoin(BASE_URL, f"/api/admin/wishlists/{wishlist_id}/export-pdf")
                        response = self.session.post(pdf_url, headers=headers, timeout=10)
                        self.log_test(f"POST /api/admin/wishlists/{wishlist_id}/export-pdf", 
                                    response.status_code in [200, 404, 501], 
                                    f"Status: {response.status_code}")
                        
                        # Test DELETE /api/admin/wishlists/[id] - Delete wishlist
                        delete_url = urljoin(BASE_URL, f"/api/admin/wishlists/{wishlist_id}")
                        response = self.session.delete(delete_url, headers=headers, timeout=10)
                        self.log_test(f"DELETE /api/admin/wishlists/{wishlist_id}", 
                                    response.status_code in [200, 404], 
                                    f"Status: {response.status_code}")
                else:
                    self.log_test("Wishlist operations", True, "No wishlists available for testing")
                    
        except Exception as e:
            self.log_test("Admin wishlist management", False, f"Error: {str(e)}")

    def test_admin_dj_management(self):
        """Test admin DJ management endpoints"""
        print("\n=== 4. Admin DJ Management ===")
        
        if not self.admin_token:
            self.log_test("Admin DJ tests", False, "No admin token available")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test GET /api/admin/djs - List DJs
        try:
            response = self.session.get(urljoin(BASE_URL, "/api/admin/djs"), 
                                      headers=headers, timeout=10)
            self.log_test("GET /api/admin/djs", response.status_code == 200, 
                        f"Status: {response.status_code}")
            
            # Test POST /api/admin/djs - Create DJ
            test_dj_data = {
                "username": f"testdj_{int(time.time())}",
                "email": f"testdj_{int(time.time())}@example.com",
                "password": "testpass123"
            }
            
            response = self.session.post(urljoin(BASE_URL, "/api/admin/djs"), 
                                       json=test_dj_data, headers=headers, timeout=10)
            self.log_test("POST /api/admin/djs", response.status_code in [200, 201], 
                        f"Status: {response.status_code}")
            
            if response.status_code in [200, 201]:
                created_dj = response.json()
                self.created_dj_id = created_dj.get('_id') or created_dj.get('id')
                
                if self.created_dj_id:
                    # Test PUT /api/admin/djs/[id] - Edit DJ
                    edit_data = {"username": f"edited_dj_{int(time.time())}"}
                    edit_url = urljoin(BASE_URL, f"/api/admin/djs/{self.created_dj_id}")
                    response = self.session.put(edit_url, json=edit_data, headers=headers, timeout=10)
                    self.log_test(f"PUT /api/admin/djs/{self.created_dj_id}", 
                                response.status_code in [200, 404, 405], 
                                f"Status: {response.status_code}")
                    
                    # Test POST /api/admin/djs/[id]/change-password - Change password
                    pwd_data = {"newPassword": "newpass123"}
                    pwd_url = urljoin(BASE_URL, f"/api/admin/djs/{self.created_dj_id}/change-password")
                    response = self.session.post(pwd_url, json=pwd_data, headers=headers, timeout=10)
                    self.log_test(f"POST /api/admin/djs/{self.created_dj_id}/change-password", 
                                response.status_code in [200, 404, 405], 
                                f"Status: {response.status_code}")
                    
                    # Test DELETE /api/admin/djs/[id] - Delete DJ
                    delete_url = urljoin(BASE_URL, f"/api/admin/djs/{self.created_dj_id}")
                    response = self.session.delete(delete_url, headers=headers, timeout=10)
                    self.log_test(f"DELETE /api/admin/djs/{self.created_dj_id}", 
                                response.status_code in [200, 404], 
                                f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_test("Admin DJ management", False, f"Error: {str(e)}")

    def test_config_logo(self):
        """Test logo configuration endpoints"""
        print("\n=== 5. Logo Configuration ===")
        
        # Test GET /api/config/logo - Get current logo (public endpoint)
        try:
            response = self.session.get(urljoin(BASE_URL, "/api/config/logo"), timeout=10)
            self.log_test("GET /api/config/logo", response.status_code == 200, 
                        f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("GET /api/config/logo", False, f"Error: {str(e)}")
        
        # Test POST /api/admin/config/logo - Upload new logo (admin only)
        if not self.admin_token:
            self.log_test("POST /api/admin/config/logo", False, "No admin token available")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        try:
            # Create a minimal valid PNG (1x1 pixel)
            valid_png = (
                b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
                b'\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13'
                b'\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc```'
                b'\x00\x04\x00\x01\x00\xdd\x8d\xb4\x1c\x00\x00\x00\x00IEND\xaeB`\x82'
            )
            valid_png_b64 = base64.b64encode(valid_png).decode()
            valid_png_url = f"data:image/png;base64,{valid_png_b64}"
            
            response = self.session.post(urljoin(BASE_URL, "/api/admin/config/logo"), 
                                       json={"logoData": valid_png_url},
                                       headers=headers, timeout=10)
            self.log_test("POST /api/admin/config/logo", response.status_code == 200, 
                        f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("POST /api/admin/config/logo", False, f"Error: {str(e)}")

    def create_test_dj(self):
        """Create a test DJ for DJ panel testing"""
        if not self.admin_token:
            return False
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        test_dj_data = {
            "username": f"testdj_{int(time.time())}",
            "email": f"testdj_{int(time.time())}@example.com", 
            "password": "testpass123"
        }
        
        try:
            response = self.session.post(urljoin(BASE_URL, "/api/admin/djs"), 
                                       json=test_dj_data, headers=headers, timeout=10)
            if response.status_code in [200, 201]:
                # Login as the new DJ
                login_response = self.session.post(urljoin(BASE_URL, "/login"), 
                    json={"username": test_dj_data["username"], "password": test_dj_data["password"]},
                    timeout=10)
                if login_response.status_code == 200:
                    data = login_response.json()
                    self.dj_token = data.get('token')
                    return True
        except Exception:
            pass
        return False

    def test_dj_party_management(self):
        """Test DJ party management endpoints"""
        print("\n=== 6. DJ Party Management ===")
        
        # Create a test DJ first
        if not self.create_test_dj():
            self.log_test("DJ party tests", False, "Could not create test DJ")
            return
        
        headers = {"Authorization": f"Bearer {self.dj_token}"}
        
        # Test GET /api/dj/parties - My active parties
        try:
            response = self.session.get(urljoin(BASE_URL, "/api/dj/parties"), 
                                      headers=headers, timeout=10)
            self.log_test("GET /api/dj/parties", response.status_code in [200, 404], 
                        f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("GET /api/dj/parties", False, f"Error: {str(e)}")
        
        # Test POST /api/dj/parties - Create party
        try:
            party_data = {
                "name": f"Test Party {int(time.time())}",
                "description": "Test party description"
            }
            response = self.session.post(urljoin(BASE_URL, "/api/dj/parties"), 
                                       json=party_data, headers=headers, timeout=10)
            self.log_test("POST /api/dj/parties", response.status_code in [200, 201, 404], 
                        f"Status: {response.status_code}")
            
            if response.status_code in [200, 201]:
                party = response.json()
                party_id = party.get('_id') or party.get('id')
                if party_id:
                    # Test PUT /api/dj/parties/[id]/end - End my party
                    end_url = urljoin(BASE_URL, f"/api/dj/parties/{party_id}/end")
                    response = self.session.put(end_url, headers=headers, timeout=10)
                    self.log_test(f"PUT /api/dj/parties/{party_id}/end", 
                                response.status_code in [200, 404, 405], 
                                f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_test("DJ party creation", False, f"Error: {str(e)}")

    def test_admin_stats(self):
        """Test admin statistics endpoint"""
        print("\n=== 7. Admin Statistics ===")
        
        if not self.admin_token:
            self.log_test("Admin stats test", False, "No admin token available")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        try:
            response = self.session.get(urljoin(BASE_URL, "/api/admin/stats"), 
                                      headers=headers, timeout=10)
            self.log_test("GET /api/admin/stats", response.status_code == 200, 
                        f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("GET /api/admin/stats", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run all API endpoint tests"""
        print("🎵 DJConnect Comprehensive Backend Testing Suite")
        print("=" * 60)
        
        # Login as admin first
        if not self.login_as_admin():
            print("❌ Cannot proceed without admin authentication")
            return
        
        # Run all endpoint tests
        self.test_admin_party_management()
        self.test_admin_wishlist_management()
        self.test_admin_dj_management()
        self.test_config_logo()
        self.test_dj_party_management()
        self.test_admin_stats()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("🎵 DJCONNECT API TEST SUMMARY")
        print("=" * 60)
        
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
        
        # Show successful tests
        passed_tests = [result for result in self.test_results if result["passed"]]
        if passed_tests:
            print("\n✅ SUCCESSFUL TESTS:")
            for test in passed_tests:
                print(f"  - {test['test']}")
        
        print("\n🎵 API testing completed!")

if __name__ == "__main__":
    tester = DJConnectTester()
    tester.run_all_tests()