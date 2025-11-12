const token = localStorage.getItem('dj-token');
const serverUrl = window.SERVER_URL || window.location.origin;

if (!token) {
    window.location.href = '/html/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    verifyAdmin();
    loadDJs();
    loadWishlists();
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
    document.getElementById('create-wishlist-form').addEventListener('submit', createWishlist);
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
            option.textContent = dj.username;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error:', error);
    }
}

async function loadWishlists() {
    const loadingMessage = document.getElementById('loading-message');
    const wishlistsList = document.getElementById('wishlists-list');
    
    try {
        const response = await fetch(`${serverUrl}/api/admin/wishlists`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Error al cargar wishlists');
        
        const wishlists = await response.json();
        loadingMessage.style.display = 'none';
        
        if (wishlists.length === 0) {
            wishlistsList.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary);">No hay wishlists.</p>';
            return;
        }
        
        wishlistsList.innerHTML = '';
        wishlists.forEach(wishlist => {
            const card = createWishlistCard(wishlist);
            wishlistsList.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error:', error);
        loadingMessage.textContent = 'Error al cargar wishlists.';
        loadingMessage.style.color = 'var(--color-error)';
    }
}

function createWishlistCard(wishlist) {
    const card = document.createElement('div');
    card.className = 'stats-panel';
    card.style.marginBottom = '15px';
    
    const statusBadge = wishlist.isActive 
        ? '<span style="color: var(--color-secondary);">🟢 Activa</span>' 
        : '<span style="color: var(--color-text-secondary);">⚪ Cerrada</span>';
    
    const eventDate = wishlist.eventDate 
        ? new Date(wishlist.eventDate).toLocaleDateString('es-ES') 
        : 'Sin fecha';
    
    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 10px;">
            <div style="flex: 1; min-width: 200px;">
                <h3 style="margin: 0 0 10px 0; color: var(--color-secondary);">
                    ${wishlist.name}
                </h3>
                <p style="margin: 5px 0; font-size: 0.9em;">
                    🎧 DJ: <strong>${wishlist.djUsername}</strong>
                </p>
                <p style="margin: 5px 0; font-size: 0.9em;">
                    ${statusBadge} • 
                    <strong>${wishlist.songs.length}</strong> canciones • 
                    📅 ${eventDate}
                </p>
                ${wishlist.description ? `<p style="margin: 5px 0; color: var(--color-text-secondary); font-size: 0.85em;">${wishlist.description}</p>` : ''}
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="toggleWishlist('${wishlist.wishlistId}')" 
                        style="width: auto; padding: 10px 15px; background-color: ${wishlist.isActive ? '#666' : 'var(--color-secondary)'};">
                    ${wishlist.isActive ? '🔒 Cerrar' : '🔓 Abrir'}
                </button>
                <button onclick="deleteWishlist('${wishlist.wishlistId}', '${wishlist.name}')" 
                        style="width: auto; padding: 10px 15px; background-color: var(--color-error);">
                    🗑️ Eliminar
                </button>
            </div>
        </div>
    `;
    
    return card;
}

async function createWishlist(e) {
    e.preventDefault();
    
    const name = document.getElementById('wishlist-name').value.trim();
    const description = document.getElementById('wishlist-description').value.trim();
    const eventDate = document.getElementById('wishlist-date').value;
    const djUsername = document.getElementById('dj-select').value;
    
    if (!name || !djUsername) {
        alert('Por favor, completa nombre y DJ.');
        return;
    }
    
    try {
        const response = await fetch(`${serverUrl}/api/admin/wishlists`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, description, eventDate, djUsername })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            alert(`❌ Error: ${data.message}`);
            return;
        }
        
        alert(`✅ Wishlist "${name}" creada y asignada a ${djUsername}!`);
        document.getElementById('create-wishlist-form').reset();
        loadWishlists();
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al crear wishlist.');
    }
}

async function toggleWishlist(wishlistId) {
    try {
        const response = await fetch(`${serverUrl}/api/wishlists/${wishlistId}/toggle`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Error al cambiar estado');
        
        loadWishlists();
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al cambiar estado.');
    }
}

async function deleteWishlist(wishlistId, wishlistName) {
    if (!confirm(`¿Estás seguro de eliminar la wishlist "${wishlistName}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${serverUrl}/api/wishlists/${wishlistId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Error al eliminar');
        
        alert('✅ Wishlist eliminada exitosamente');
        loadWishlists();
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al eliminar wishlist.');
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
