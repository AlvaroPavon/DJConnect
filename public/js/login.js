document.addEventListener('DOMContentLoaded', () => {
    loadCompanyLogo();
});

async function loadCompanyLogo() {
    try {
        const serverUrl = window.SERVER_URL || window.location.origin;
        const response = await fetch(`${serverUrl}/api/config/logo`);
        if (response.ok) {
            const data = await response.json();
            if (data.logoUrl) {
                const logo = document.getElementById('company-logo');
                if (logo) {
                    logo.src = data.logoUrl;
                    logo.style.display = 'block';
                }
            }
        }
    } catch (error) {
        console.error('Error loading logo:', error);
    }
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const serverUrl = window.SERVER_URL || window.location.origin;

    const response = await fetch(`${serverUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('dj-token', data.token);
        
        // Redirigir según el rol del usuario
        if (data.role === 'admin') {
            window.location.href = `/html/admin.html`;
        } else {
            window.location.href = `/html/dj.html`;
        }
    } else {
        const data = await response.json();
        alert(`Error: ${data.message}`);
    }
});