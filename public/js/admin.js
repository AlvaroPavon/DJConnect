const token = localStorage.getItem('dj-token');
const serverUrl = window.SERVER_URL || window.location.origin;

if (!token) {
    window.location.href = '/html/login.html';
}

// Verificar que sea admin
fetch(`${serverUrl}/api/verify-admin`, {
    headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => {
    if (!res.ok) {
        alert('❌ Acceso denegado. Solo administradores pueden acceder.');
        window.location.href = '/html/dj.html';
    }
})
.catch(err => {
    console.error('Error:', err);
    window.location.href = '/html/login.html';
});

document.addEventListener('DOMContentLoaded', () => {
    loadAdminData();
    loadCompanyLogo();
});

async function loadAdminData() {
    try {
        // Obtener datos del admin
        const userRes = await fetch(`${serverUrl}/api/admin/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const userData = await userRes.json();
        document.getElementById('admin-name').textContent = userData.username;

        // Obtener estadísticas
        const statsRes = await fetch(`${serverUrl}/api/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const stats = await statsRes.json();
        
        document.getElementById('total-djs').textContent = stats.totalDJs;
        document.getElementById('active-parties').textContent = stats.activeParties;
        document.getElementById('total-wishlists').textContent = stats.totalWishlists;
        
    } catch (error) {
        console.error('Error:', error);
    }
}

async function loadCompanyLogo() {
    try {
        const response = await fetch(`${serverUrl}/api/config/logo`);
        if (response.ok) {
            const data = await response.json();
            if (data.logoUrl) {
                const logo = document.getElementById('company-logo');
                logo.src = data.logoUrl;
                logo.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error loading logo:', error);
    }
}

function logout() {
    localStorage.removeItem('dj-token');
    window.location.href = '/html/login.html';
}
