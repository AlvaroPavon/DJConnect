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
                <button onclick="viewWishlistDetails('${wishlist.wishlistId}')" 
                        style="width: auto; padding: 10px 15px; background-color: var(--color-primary);">
                    👁️ Ver Detalles
                </button>
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

async function viewWishlistDetails(wishlistId) {
    try {
        const response = await fetch(`${serverUrl}/api/wishlists/${wishlistId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Error al cargar wishlist');
        
        const wishlist = await response.json();
        showWishlistModal(wishlist);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los detalles de la wishlist.');
    }
}

function showWishlistModal(wishlist) {
    const modal = document.createElement('div');
    modal.id = 'wishlist-detail-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 1000;';
    
    const eventDate = wishlist.eventDate 
        ? new Date(wishlist.eventDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'Sin fecha definida';
    
    const statusText = wishlist.isActive ? '🟢 Activa (Invitados pueden agregar canciones)' : '⚪ Cerrada (No se aceptan más canciones)';
    
    const wishlistUrl = `${window.location.origin}/html/wishlist.html?w=${wishlist.wishlistId}`;
    
    const songsHtml = wishlist.songs.length > 0 
        ? wishlist.songs.map(song => `
            <div style="background-color: #2c2c2c; padding: 12px; margin: 8px 0; border-radius: 5px; border-left: 3px solid var(--color-secondary);">
                <strong style="display: block; color: var(--color-text-primary);">${song.titulo}</strong>
                <em style="display: block; color: var(--color-text-secondary); font-size: 0.9em;">${song.artista}</em>
                <small style="color: var(--color-text-secondary);">
                    🎵 ${song.genre} • 👤 ${song.addedBy} • 🕐 ${new Date(song.timestamp).toLocaleString('es-ES')}
                </small>
            </div>
        `).join('')
        : '<p style="text-align: center; color: var(--color-text-secondary);">No hay canciones aún</p>';
    
    modal.innerHTML = `
        <div style="background: var(--color-surface); padding: 30px; border-radius: 12px; max-width: 800px; max-height: 90vh; overflow-y: auto; width: 90%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: var(--color-secondary);">${wishlist.name}</h2>
                <button onclick="closeWishlistModal()" style="width: auto; padding: 10px 20px; background-color: var(--color-error); margin: 0;">✕</button>
            </div>
            
            <div style="background-color: rgba(187, 134, 252, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p><strong>Estado:</strong> ${statusText}</p>
                <p><strong>DJ:</strong> ${wishlist.djUsername}</p>
                <p><strong>Fecha del evento:</strong> ${eventDate}</p>
                ${wishlist.description ? `<p><strong>Descripción:</strong> ${wishlist.description}</p>` : ''}
                <p><strong>Enlace para invitados:</strong></p>
                <div style="display: flex; gap: 10px; align-items: center; margin-top: 10px;">
                    <input type="text" value="${wishlistUrl}" readonly style="flex: 1; padding: 10px; background-color: #333; border: 1px solid var(--color-border); border-radius: 5px; color: var(--color-text-primary);">
                    <button onclick="copyWishlistLink('${wishlistUrl}')" style="width: auto; padding: 10px 15px; background-color: var(--color-secondary); margin: 0;">📋 Copiar</button>
                </div>
            </div>
            
            <h3>🎵 Canciones Sugeridas (${wishlist.songs.length})</h3>
            <div style="max-height: 400px; overflow-y: auto;">
                ${songsHtml}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeWishlistModal() {
    const modal = document.getElementById('wishlist-detail-modal');
    if (modal) {
        modal.remove();
    }
}

function copyWishlistLink(url) {
    navigator.clipboard.writeText(url).then(() => {
        alert('✅ Enlace copiado al portapapeles!');
    }).catch(() => {
        prompt('Copia este enlace:', url);
    });
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
