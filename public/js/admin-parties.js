const token = localStorage.getItem('dj-token');
const serverUrl = window.SERVER_URL || window.location.origin;

if (!token) {
    window.location.href = '/html/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    verifyAdmin();
    loadDJs();
    loadParties();
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
    document.getElementById('create-party-form').addEventListener('submit', createParty);
}

async function loadDJs() {
    try {
        const response = await fetch(`${serverUrl}/api/admin/djs`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Error al cargar DJs');
        
        const djs = await response.json();
        const select = document.getElementById('dj-select');
        
        djs.filter(dj => dj.role === 'dj').forEach(dj => {
            const option = document.createElement('option');
            option.value = dj.username;
            const activeParties = dj.activePartyIds ? dj.activePartyIds.length : 0;
            option.textContent = `${dj.username} (${activeParties}/3 fiestas activas)`;
            option.disabled = activeParties >= 3;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error:', error);
    }
}

async function loadParties() {
    const loadingMessage = document.getElementById('loading-message');
    const partiesList = document.getElementById('parties-list');
    
    try {
        const response = await fetch(`${serverUrl}/api/admin/parties`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Error al cargar fiestas');
        
        const parties = await response.json();
        loadingMessage.style.display = 'none';
        
        if (parties.length === 0) {
            partiesList.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary);">No hay fiestas activas.</p>';
            return;
        }
        
        partiesList.innerHTML = '';
        parties.forEach(party => {
            const card = createPartyCard(party);
            partiesList.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error:', error);
        loadingMessage.textContent = 'Error al cargar fiestas.';
        loadingMessage.style.color = 'var(--color-error)';
    }
}

function createPartyCard(party) {
    const card = document.createElement('div');
    card.className = 'stats-panel';
    card.style.marginBottom = '15px';
    
    const createdDate = new Date(party.createdAt).toLocaleString('es-ES');
    
    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 10px;">
            <div style="flex: 1; min-width: 200px;">
                <h3 style="margin: 0 0 10px 0; color: var(--color-secondary);">
                    ${party.partyId}
                </h3>
                <p style="margin: 5px 0; font-size: 0.9em;">
                    🎧 DJ: <strong>${party.djUsername}</strong>
                </p>
                <p style="margin: 5px 0; font-size: 0.9em; color: var(--color-text-secondary);">
                    📅 Creada: ${createdDate}
                </p>
                <p style="margin: 5px 0; font-size: 0.9em; color: var(--color-text-secondary);">
                    🎵 Peticiones: ${party.songRequests.length}
                </p>
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="endParty('${party.partyId}', '${party.djUsername}')" 
                        style="width: auto; padding: 10px 15px; background-color: var(--color-error);">
                    ❌ Finalizar Fiesta
                </button>
            </div>
        </div>
    `;
    
    return card;
}

async function createParty(e) {
    e.preventDefault();
    
    const partyName = document.getElementById('party-name').value.trim();
    const djUsername = document.getElementById('dj-select').value;
    
    if (!partyName || !djUsername) {
        alert('Por favor, completa todos los campos.');
        return;
    }
    
    try {
        const response = await fetch(`${serverUrl}/api/admin/parties`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ partyName, djUsername })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            alert(`❌ Error: ${data.message}`);
            return;
        }
        
        alert(`✅ Fiesta "${partyName}" creada y asignada a ${djUsername}!`);
        document.getElementById('create-party-form').reset();
        loadDJs();
        loadParties();
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al crear fiesta.');
    }
}

async function endParty(partyId, djUsername) {
    if (!confirm(`¿Estás seguro de finalizar la fiesta "${partyId}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${serverUrl}/api/admin/parties/${partyId}/end`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ djUsername })
        });
        
        if (!response.ok) throw new Error('Error al finalizar fiesta');
        
        alert('✅ Fiesta finalizada exitosamente');
        loadParties();
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al finalizar fiesta.');
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
