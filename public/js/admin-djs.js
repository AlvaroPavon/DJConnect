const token = localStorage.getItem('dj-token');
const serverUrl = window.SERVER_URL || window.location.origin;

if (!token) {
    window.location.href = '/html/login.html';
}

let currentDJId = null;

document.addEventListener('DOMContentLoaded', () => {
    verifyAdmin();
    loadDJs();
    loadCompanyLogo();
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
    document.getElementById('create-dj-form').addEventListener('submit', createDJ);
    document.getElementById('change-password-form').addEventListener('submit', changePassword);
}

async function loadDJs() {
    const loadingMessage = document.getElementById('loading-message');
    const djsList = document.getElementById('djs-list');
    
    try {
        const response = await fetch(`${serverUrl}/api/admin/djs`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Error al cargar DJs');
        
        const djs = await response.json();
        loadingMessage.style.display = 'none';
        
        if (djs.length === 0) {
            djsList.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary);">No hay DJs registrados.</p>';
            return;
        }
        
        djsList.innerHTML = '';
        djs.forEach(dj => {
            const card = createDJCard(dj);
            djsList.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error:', error);
        loadingMessage.textContent = 'Error al cargar DJs.';
        loadingMessage.style.color = 'var(--color-error)';
    }
}

function createDJCard(dj) {
    const card = document.createElement('div');
    card.className = 'stats-panel';
    card.style.marginBottom = '15px';
    
    const roleText = dj.role === 'admin' ? '🛡️ Admin' : '🎧 DJ';
    const activeParties = dj.activePartyIds ? dj.activePartyIds.length : 0;
    
    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 10px;">
            <div style="flex: 1; min-width: 200px;">
                <h3 style="margin: 0 0 10px 0; color: var(--color-secondary);">
                    ${dj.username} ${roleText}
                </h3>
                <p style="margin: 5px 0; font-size: 0.9em;">
                    📧 ${dj.email}
                </p>
                <p style="margin: 5px 0; font-size: 0.9em; color: var(--color-text-secondary);">
                    🎉 ${dj.partyCount} fiestas totales • 
                    🔴 ${activeParties}/3 fiestas activas
                </p>
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="openPasswordModal('${dj._id}', '${dj.username}')" 
                        style="width: auto; padding: 10px 15px; background-color: var(--color-primary);">
                    🔑 Cambiar Contraseña
                </button>
                ${dj.role !== 'admin' ? `
                <button onclick="deleteDJ('${dj._id}', '${dj.username}')" 
                        style="width: auto; padding: 10px 15px; background-color: var(--color-error);">
                    🗑️ Eliminar
                </button>
                ` : ''}
            </div>
        </div>
    `;
    
    return card;
}

async function createDJ(e) {
    e.preventDefault();
    
    const username = document.getElementById('dj-username').value.trim();
    const email = document.getElementById('dj-email').value.trim();
    const password = document.getElementById('dj-password').value;
    
    if (!username || !email || !password) {
        alert('Por favor, completa todos los campos.');
        return;
    }
    
    try {
        const response = await fetch(`${serverUrl}/api/admin/djs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            alert(`❌ Error: ${data.message}`);
            return;
        }
        
        alert('✅ DJ creado exitosamente!');
        document.getElementById('create-dj-form').reset();
        loadDJs();
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al crear DJ. Intenta de nuevo.');
    }
}

function openPasswordModal(djId, djUsername) {
    currentDJId = djId;
    document.getElementById('password-dj-name').textContent = `Cambiar contraseña de: ${djUsername}`;
    document.getElementById('password-modal').style.display = 'flex';
}

function closePasswordModal() {
    currentDJId = null;
    document.getElementById('password-modal').style.display = 'none';
    document.getElementById('change-password-form').reset();
}

async function changePassword(e) {
    e.preventDefault();
    
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (newPassword !== confirmPassword) {
        alert('❌ Las contraseñas no coinciden.');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('❌ La contraseña debe tener al menos 6 caracteres.');
        return;
    }
    
    try {
        const response = await fetch(`${serverUrl}/api/admin/djs/${currentDJId}/password`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ password: newPassword })
        });
        
        if (!response.ok) throw new Error('Error al cambiar contraseña');
        
        alert('✅ Contraseña actualizada exitosamente!');
        closePasswordModal();
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al cambiar contraseña.');
    }
}

async function deleteDJ(djId, djUsername) {
    if (!confirm(`¿Estás seguro de eliminar al DJ "${djUsername}"? Esta acción no se puede deshacer.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${serverUrl}/api/admin/djs/${djId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Error al eliminar');
        
        alert('✅ DJ eliminado exitosamente');
        loadDJs();
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al eliminar DJ.');
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
