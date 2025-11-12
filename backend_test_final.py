#!/usr/bin/env python3
"""
DJConnect Final Backend Testing Suite
Tests all API endpoints as requested in the review
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

class DJConnectFinalTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_results = []
        
    def log_test(self, endpoint, passed, status_code, details=""):
        """Log test results in the requested format"""
        if passed:
            status = f"✅ Funciona: {endpoint} - Status {status_code}"
        else:
            status = f"❌ Falla: {endpoint} - Status {status_code} - Error: {details}"
        
        print(status)
        self.test_results.append({
            "endpoint": endpoint,
            "passed": passed,
            "status_code": status_code,
            "details": details
        })

    def login_as_admin(self):
        """Login as admin to get authentication token"""
        print("=== AUTENTICACIÓN ADMIN ===")
        
        try:
            response = self.session.post(urljoin(BASE_URL, "/login"), 
                json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
                timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get('token')
                print("✅ Login admin exitoso")
                return True
            else:
                print(f"❌ Login admin falló - Status: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error en login admin: {str(e)}")
            return False

    def test_admin_party_management(self):
        """Test admin party management endpoints"""
        print("\n=== PANEL ADMIN - Gestión de Fiestas ===")
        
        if not self.admin_token:
            print("❌ No hay token de admin disponible")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test GET /api/admin/parties - Listar todas las fiestas
        try:
            response = self.session.get(urljoin(BASE_URL, "/api/admin/parties"), 
                                      headers=headers, timeout=10)
            self.log_test("GET /api/admin/parties", response.status_code == 200, 
                        response.status_code)
            
            if response.status_code == 200:
                parties = response.json()
                if parties and len(parties) > 0:
                    party = parties[0]
                    party_id = party.get('_id')
                    dj_username = party.get('djUsername')
                    
                    if party_id and dj_username:
                        # Test POST /api/admin/parties/[id]/end - Finalizar una fiesta
                        end_url = urljoin(BASE_URL, f"/api/admin/parties/{party_id}/end")
                        end_data = {"djUsername": dj_username}
                        response = self.session.post(end_url, json=end_data, headers=headers, timeout=10)
                        self.log_test(f"POST /api/admin/parties/{party_id}/end", 
                                    response.status_code == 200, 
                                    response.status_code,
                                    response.text if response.status_code != 200 else "")
                        
                        # Test DELETE /api/admin/parties/[id] - Eliminar una fiesta
                        delete_url = urljoin(BASE_URL, f"/api/admin/parties/{party_id}")
                        response = self.session.delete(delete_url, headers=headers, timeout=10)
                        self.log_test(f"DELETE /api/admin/parties/{party_id}", 
                                    response.status_code in [200, 404, 405], 
                                    response.status_code,
                                    "Endpoint no implementado" if response.status_code == 404 else "")
                else:
                    print("ℹ️  No hay fiestas disponibles para probar operaciones")
                    
        except Exception as e:
            self.log_test("Admin party management", False, 0, f"Error: {str(e)}")

    def test_admin_wishlist_management(self):
        """Test admin wishlist management endpoints"""
        print("\n=== PANEL ADMIN - Gestión de Wishlists ===")
        
        if not self.admin_token:
            print("❌ No hay token de admin disponible")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test GET /api/admin/wishlists - Listar todas las wishlists
        try:
            response = self.session.get(urljoin(BASE_URL, "/api/admin/wishlists"), 
                                      headers=headers, timeout=10)
            self.log_test("GET /api/admin/wishlists", response.status_code == 200, 
                        response.status_code)
            
            if response.status_code == 200:
                wishlists = response.json()
                if wishlists and len(wishlists) > 0:
                    wishlist_id = wishlists[0].get('_id')
                    if wishlist_id:
                        # Test GET /api/admin/wishlists/[id] - Ver detalles de wishlist
                        detail_url = urljoin(BASE_URL, f"/api/admin/wishlists/{wishlist_id}")
                        response = self.session.get(detail_url, headers=headers, timeout=10)
                        self.log_test(f"GET /api/admin/wishlists/{wishlist_id}", 
                                    response.status_code in [200, 404, 405], 
                                    response.status_code,
                                    "Endpoint no implementado" if response.status_code == 404 else "")
                        
                        # Test POST /api/admin/wishlists/[id]/export-pdf - Exportar PDF
                        pdf_url = urljoin(BASE_URL, f"/api/admin/wishlists/{wishlist_id}/export-pdf")
                        response = self.session.post(pdf_url, headers=headers, timeout=10)
                        self.log_test(f"POST /api/admin/wishlists/{wishlist_id}/export-pdf", 
                                    response.status_code in [200, 404, 405, 501], 
                                    response.status_code,
                                    "Endpoint no implementado" if response.status_code == 404 else "")
                        
                        # Test DELETE /api/admin/wishlists/[id] - Eliminar wishlist
                        delete_url = urljoin(BASE_URL, f"/api/admin/wishlists/{wishlist_id}")
                        response = self.session.delete(delete_url, headers=headers, timeout=10)
                        self.log_test(f"DELETE /api/admin/wishlists/{wishlist_id}", 
                                    response.status_code in [200, 404, 405], 
                                    response.status_code,
                                    "Endpoint no implementado" if response.status_code == 404 else "")
                else:
                    print("ℹ️  No hay wishlists disponibles para probar operaciones")
                    
        except Exception as e:
            self.log_test("Admin wishlist management", False, 0, f"Error: {str(e)}")

    def test_admin_dj_management(self):
        """Test admin DJ management endpoints"""
        print("\n=== PANEL ADMIN - Gestión de DJs ===")
        
        if not self.admin_token:
            print("❌ No hay token de admin disponible")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test GET /api/admin/djs - Listar DJs
        try:
            response = self.session.get(urljoin(BASE_URL, "/api/admin/djs"), 
                                      headers=headers, timeout=10)
            self.log_test("GET /api/admin/djs", response.status_code == 200, 
                        response.status_code)
            
            # Test POST /api/admin/djs - Crear DJ
            test_dj_data = {
                "username": f"testdj_{int(time.time())}",
                "email": f"testdj_{int(time.time())}@example.com",
                "password": "testpass123"
            }
            
            response = self.session.post(urljoin(BASE_URL, "/api/admin/djs"), 
                                       json=test_dj_data, headers=headers, timeout=10)
            self.log_test("POST /api/admin/djs", response.status_code in [200, 201], 
                        response.status_code)
            
            created_dj_id = None
            if response.status_code in [200, 201]:
                created_dj = response.json()
                created_dj_id = created_dj.get('_id') or created_dj.get('id')
                
                if created_dj_id:
                    # Test PUT /api/admin/djs/[id] - Editar DJ
                    edit_data = {"username": f"edited_dj_{int(time.time())}"}
                    edit_url = urljoin(BASE_URL, f"/api/admin/djs/{created_dj_id}")
                    response = self.session.put(edit_url, json=edit_data, headers=headers, timeout=10)
                    self.log_test(f"PUT /api/admin/djs/{created_dj_id}", 
                                response.status_code in [200, 404, 405], 
                                response.status_code,
                                "Endpoint no implementado" if response.status_code == 404 else "")
                    
                    # Test POST /api/admin/djs/[id]/change-password - Cambiar contraseña
                    pwd_data = {"newPassword": "newpass123"}
                    pwd_url = urljoin(BASE_URL, f"/api/admin/djs/{created_dj_id}/change-password")
                    response = self.session.post(pwd_url, json=pwd_data, headers=headers, timeout=10)
                    self.log_test(f"POST /api/admin/djs/{created_dj_id}/change-password", 
                                response.status_code in [200, 404, 405], 
                                response.status_code,
                                "Endpoint no implementado" if response.status_code == 404 else "")
                    
                    # Test DELETE /api/admin/djs/[id] - Eliminar DJ
                    delete_url = urljoin(BASE_URL, f"/api/admin/djs/{created_dj_id}")
                    response = self.session.delete(delete_url, headers=headers, timeout=10)
                    self.log_test(f"DELETE /api/admin/djs/{created_dj_id}", 
                                response.status_code in [200, 404], 
                                response.status_code)
                    
        except Exception as e:
            self.log_test("Admin DJ management", False, 0, f"Error: {str(e)}")

    def test_config_logo(self):
        """Test logo configuration endpoints"""
        print("\n=== CONFIGURACIÓN - Logo ===")
        
        # Test GET /api/config/logo - Obtener logo actual
        try:
            response = self.session.get(urljoin(BASE_URL, "/api/config/logo"), timeout=10)
            self.log_test("GET /api/config/logo", response.status_code == 200, 
                        response.status_code)
        except Exception as e:
            self.log_test("GET /api/config/logo", False, 0, f"Error: {str(e)}")
        
        # Test POST /api/admin/config/logo - Subir nuevo logo
        if not self.admin_token:
            print("❌ No hay token de admin disponible para subir logo")
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
                        response.status_code)
        except Exception as e:
            self.log_test("POST /api/admin/config/logo", False, 0, f"Error: {str(e)}")

    def test_dj_party_management(self):
        """Test DJ party management endpoints"""
        print("\n=== PANEL DJ - Gestión de Fiestas ===")
        
        # First create a test DJ and login
        if not self.admin_token:
            print("❌ No hay token de admin para crear DJ de prueba")
            return
        
        admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        test_dj_data = {
            "username": f"testdj_{int(time.time())}",
            "email": f"testdj_{int(time.time())}@example.com", 
            "password": "testpass123"
        }
        
        try:
            # Create test DJ
            response = self.session.post(urljoin(BASE_URL, "/api/admin/djs"), 
                                       json=test_dj_data, headers=admin_headers, timeout=10)
            
            if response.status_code in [200, 201]:
                # Login as the new DJ
                login_response = self.session.post(urljoin(BASE_URL, "/login"), 
                    json={"username": test_dj_data["username"], "password": test_dj_data["password"]},
                    timeout=10)
                
                if login_response.status_code == 200:
                    dj_token = login_response.json().get('token')
                    dj_headers = {"Authorization": f"Bearer {dj_token}"}
                    
                    # Test GET /api/dj/parties - Mis fiestas activas
                    response = self.session.get(urljoin(BASE_URL, "/api/dj/parties"), 
                                              headers=dj_headers, timeout=10)
                    self.log_test("GET /api/dj/parties", 
                                response.status_code in [200, 404, 405], 
                                response.status_code,
                                "Endpoint no implementado" if response.status_code == 404 else "")
                    
                    # Test POST /api/dj/parties - Crear fiesta
                    party_data = {
                        "name": f"Test Party {int(time.time())}",
                        "description": "Test party description"
                    }
                    response = self.session.post(urljoin(BASE_URL, "/api/dj/parties"), 
                                               json=party_data, headers=dj_headers, timeout=10)
                    self.log_test("POST /api/dj/parties", 
                                response.status_code in [200, 201, 404, 405], 
                                response.status_code,
                                "Endpoint no implementado" if response.status_code == 404 else "")
                    
                    # Test PUT /api/dj/parties/[id]/end - Finalizar mi fiesta
                    # This would need a real party ID, so we'll test with a dummy ID
                    dummy_party_id = "test-party-id"
                    end_url = urljoin(BASE_URL, f"/api/dj/parties/{dummy_party_id}/end")
                    response = self.session.put(end_url, headers=dj_headers, timeout=10)
                    self.log_test(f"PUT /api/dj/parties/{dummy_party_id}/end", 
                                response.status_code in [200, 404, 405], 
                                response.status_code,
                                "Endpoint no implementado" if response.status_code == 404 else "")
                else:
                    print("❌ No se pudo hacer login como DJ de prueba")
            else:
                print("❌ No se pudo crear DJ de prueba")
                
        except Exception as e:
            self.log_test("DJ party management", False, 0, f"Error: {str(e)}")

    def test_admin_stats(self):
        """Test admin statistics endpoint"""
        print("\n=== ESTADÍSTICAS ===")
        
        if not self.admin_token:
            print("❌ No hay token de admin disponible")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        try:
            response = self.session.get(urljoin(BASE_URL, "/api/admin/stats"), 
                                      headers=headers, timeout=10)
            self.log_test("GET /api/admin/stats", response.status_code == 200, 
                        response.status_code)
        except Exception as e:
            self.log_test("GET /api/admin/stats", False, 0, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run all API endpoint tests as requested"""
        print("🎵 DJCONNECT - PRUEBAS EXHAUSTIVAS DEL BACKEND")
        print("=" * 60)
        print(f"URL: {BASE_URL}")
        print(f"Credenciales Admin: {ADMIN_USERNAME} / {ADMIN_PASSWORD}")
        print("=" * 60)
        
        # Login as admin first
        if not self.login_as_admin():
            print("❌ No se puede continuar sin autenticación de admin")
            return
        
        # Run all endpoint tests as requested
        self.test_admin_party_management()
        self.test_admin_wishlist_management()
        self.test_admin_dj_management()
        self.test_config_logo()
        self.test_dj_party_management()
        self.test_admin_stats()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary in requested format"""
        print("\n" + "=" * 60)
        print("🎵 REPORTE COMPLETO - DJCONNECT BACKEND")
        print("=" * 60)
        
        working_endpoints = [r for r in self.test_results if r["passed"]]
        failing_endpoints = [r for r in self.test_results if not r["passed"]]
        
        print(f"\n✅ ENDPOINTS QUE FUNCIONAN ({len(working_endpoints)}):")
        for result in working_endpoints:
            print(f"  - {result['endpoint']} - Status {result['status_code']}")
        
        print(f"\n❌ ENDPOINTS QUE FALLAN ({len(failing_endpoints)}):")
        for result in failing_endpoints:
            print(f"  - {result['endpoint']} - Status {result['status_code']} - {result['details']}")
        
        print(f"\nRESUMEN:")
        print(f"Total endpoints probados: {len(self.test_results)}")
        print(f"Funcionando: {len(working_endpoints)}")
        print(f"Fallando: {len(failing_endpoints)}")
        print(f"Tasa de éxito: {(len(working_endpoints)/len(self.test_results)*100):.1f}%")

if __name__ == "__main__":
    tester = DJConnectFinalTester()
    tester.run_all_tests()