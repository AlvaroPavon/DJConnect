const token = localStorage.getItem('dj-token');
const serverUrl = window.SERVER_URL || window.location.origin;

if (!token) {
    window.location.href = '/html/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    verifyAdmin();
    loadCurrentLogo();
    loadStats();
    setupEventListeners();
});

async function verifyAdmin() {
    try {
        const res = await fetch(`${serverUrl}/api/verify-admin`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            window.location.href = '/html/dj.html';
        }
    } catch (err) {
        window.location.href = '/html/login.html';
    }
}

function setupEventListeners() {
    document.getElementById('upload-logo-form').addEventListener('submit', uploadLogo);
}

async function loadCurrentLogo() {
    try {
        const response = await fetch(`${serverUrl}/api/config/logo`);
        if (response.ok) {
            const data = await response.json();
            if (data.logoUrl) {
                const logo = document.getElementById('preview-logo');
                const headerLogo = document.getElementById('company-logo');
                logo.src = data.logoUrl;
                logo.alt = 'Logo actual';
                if (headerLogo) {
                    headerLogo.src = data.logoUrl;
                    headerLogo.style.display = 'block';
                }
            }
        }
    } catch (error) {
        console.error('Error loading logo:', error);
    }
}

async function loadStats() {
    try {
        const response = await fetch(`${serverUrl}/api/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const stats = await response.json();
            document.getElementById('total-djs').textContent = stats.totalDJs;
            document.getElementById('active-parties').textContent = stats.activeParties;
            document.getElementById('active-wishlists').textContent = stats.totalWishlists;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function uploadLogo(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('logo-file');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Por favor, selecciona un archivo de imagen.');
        return;
    }
    
    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecciona un archivo de imagen válido.');
        return;
    }
    
    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('La imagen debe pesar menos de 2MB.');
        return;
    }
    
    try {
        // Convertir a base64
        const reader = new FileReader();
        reader.onload = async function(event) {
            const base64Image = event.target.result;
            
            const response = await fetch(`${serverUrl}/api/admin/config/logo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ logoData: base64Image })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.message || 'Error desconocido';
                throw new Error(`Error al subir logo: ${errorMsg}`);
            }
            
            alert('✅ Logo actualizado exitosamente!');
            loadCurrentLogo();
            fileInput.value = '';
        };
        
        reader.readAsDataURL(file);
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al subir logo.');
    }
}
