const token = localStorage.getItem('dj-token');
if (!token) {
    window.location.href = '/html/login.html';
}

const serverUrl = window.SERVER_URL || window.location.origin;
let currentWishlist = null;
let socket = null;

// Cargar wishlists al iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadWishlists();
    setupEventListeners();
    loadCompanyLogo();
    setupSocketIO();
});

let companyLogoUrl = null;

// Configurar Socket.IO
function setupSocketIO() {
    socket = io(serverUrl, {
        auth: {
            token: token
        }
    });
    
    socket.on('connect', () => {
        console.log('✅ DJ conectado a Socket.IO');
    });
    
    // Escuchar cuando se agrega una canción
    socket.on('wishlist-song-added', (newSong) => {
        console.log('🎵 Nueva canción recibida en wishlist:', newSong);
        if (currentWishlist) {
            currentWishlist.songs.push(newSong);
            updateModalSongsList();
        }
    });
    
    // Escuchar cuando se elimina una canción
    socket.on('wishlist-song-deleted', (songId) => {
        console.log('🗑️ Canción eliminada de wishlist:', songId);
        if (currentWishlist) {
            currentWishlist.songs = currentWishlist.songs.filter(song => song._id !== songId);
            updateModalSongsList();
        }
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Desconectado de Socket.IO');
    });
}

// Actualizar lista de canciones en el modal
function updateModalSongsList() {
    const songsList = document.getElementById('modal-songs-list');
    const songCount = document.getElementById('song-count');
    
    if (!songsList || !currentWishlist) return;
    
    songCount.textContent = currentWishlist.songs.length;
    songsList.innerHTML = '';
    
    if (currentWishlist.songs.length === 0) {
        songsList.innerHTML = '<li style="text-align: center; padding: 20px; color: var(--color-text-secondary);">No hay canciones aún</li>';
    } else {
        currentWishlist.songs.forEach(song => {
            const li = document.createElement('li');
            li.style.cssText = 'background-color: #2c2c2c; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid var(--color-secondary);';
            li.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div style="flex: 1;">
                        <strong style="display: block; color: var(--color-text-primary);">${song.titulo}</strong>
                        <em style="display: block; color: var(--color-text-secondary); font-size: 0.9em;">${song.artista}</em>
                        <small style="color: var(--color-text-secondary);">
                            🎵 ${song.genre} • 
                            👤 ${song.addedBy} • 
                            🕐 ${new Date(song.timestamp).toLocaleString('es-ES')}
                        </small>
                    </div>
                    <button onclick="deleteSong('${currentWishlist.wishlistId}', '${song._id}')" 
                            style="width: auto; padding: 8px 15px; background-color: var(--color-error);">
                        🗑️
                    </button>
                </div>
            `;
            songsList.appendChild(li);
        });
    }
}

async function loadCompanyLogo() {
    try {
        const response = await fetch(`${serverUrl}/api/config/logo`);
        if (response.ok) {
            const data = await response.json();
            if (data.logoUrl) {
                companyLogoUrl = data.logoUrl;
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

function setupEventListeners() {
    // Crear wishlist
    document.getElementById('create-wishlist-form').addEventListener('submit', createWishlist);
    
    // Cerrar modal
    document.getElementById('close-modal').addEventListener('click', closeModal);
    
    // Exportar a PDF
    document.getElementById('export-pdf-btn').addEventListener('click', exportToPDF);
    
    // Copiar enlace
    document.getElementById('copy-link-btn').addEventListener('click', copyLink);
    
    // Mostrar QR
    document.getElementById('show-qr-btn').addEventListener('click', toggleQR);
}

async function loadWishlists() {
    const loadingMessage = document.getElementById('loading-message');
    const wishlistsList = document.getElementById('wishlists-list');
    
    try {
        const response = await fetch(`${serverUrl}/api/wishlists`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Error al cargar wishlists');
        
        const wishlists = await response.json();
        loadingMessage.style.display = 'none';
        
        if (wishlists.length === 0) {
            wishlistsList.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary);">No tienes wishlists aún. ¡Crea tu primera!</p>';
            return;
        }
        
        wishlistsList.innerHTML = '';
        wishlists.forEach(wishlist => {
            const card = createWishlistCard(wishlist);
            wishlistsList.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error:', error);
        loadingMessage.textContent = 'Error al cargar wishlists. Intenta recargar la página.';
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
                    ${statusBadge} • 
                    <strong>${wishlist.songs.length}</strong> canciones • 
                    📅 ${eventDate}
                </p>
                ${wishlist.description ? `<p style="margin: 5px 0; color: var(--color-text-secondary); font-size: 0.85em;">${wishlist.description}</p>` : ''}
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="viewWishlist('${wishlist.wishlistId}')" 
                        style="width: auto; padding: 10px 15px; background-color: var(--color-primary);">
                    👁️ Ver
                </button>
                <button onclick="toggleWishlistStatus('${wishlist.wishlistId}')" 
                        style="width: auto; padding: 10px 15px; background-color: ${wishlist.isActive ? '#666' : 'var(--color-secondary)'};">
                    ${wishlist.isActive ? '🔒 Cerrar' : '🔓 Abrir'}
                </button>
                <button onclick="deleteWishlist('${wishlist.wishlistId}')" 
                        style="width: auto; padding: 10px 15px; background-color: var(--color-error);">
                    🗑️
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
    
    if (!name) {
        alert('Por favor, introduce un nombre para la wishlist.');
        return;
    }
    
    try {
        const response = await fetch(`${serverUrl}/api/wishlists`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, description, eventDate })
        });
        
        if (!response.ok) throw new Error('Error al crear wishlist');
        
        alert('✅ Wishlist creada exitosamente!');
        document.getElementById('create-wishlist-form').reset();
        loadWishlists();
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al crear wishlist. Intenta de nuevo.');
    }
}

async function viewWishlist(wishlistId) {
    try {
        const response = await fetch(`${serverUrl}/api/wishlists/${wishlistId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Error al cargar wishlist');
        
        currentWishlist = await response.json();
        showModal(currentWishlist);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar la wishlist.');
    }
}

function showModal(wishlist) {
    const modal = document.getElementById('wishlist-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalInfo = document.getElementById('modal-info');
    const songsList = document.getElementById('modal-songs-list');
    const songCount = document.getElementById('song-count');
    
    // Unirse a la sala de Socket.IO para esta wishlist
    if (socket && socket.connected) {
        socket.emit('join-wishlist-room', wishlist.wishlistId);
        console.log(`📋 Uniéndose a sala de wishlist: ${wishlist.wishlistId}`);
    }
    
    modalTitle.textContent = wishlist.name;
    
    const eventDate = wishlist.eventDate 
        ? new Date(wishlist.eventDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'Sin fecha definida';
    
    const statusText = wishlist.isActive ? '🟢 Activa (Invitados pueden agregar canciones)' : '⚪ Cerrada (No se aceptan más canciones)';
    
    modalInfo.innerHTML = `
        <p><strong>Estado:</strong> ${statusText}</p>
        <p><strong>Fecha del evento:</strong> ${eventDate}</p>
        ${wishlist.description ? `<p><strong>Descripción:</strong> ${wishlist.description}</p>` : ''}
        <p><strong>Enlace para invitados:</strong> <code style="background-color: #333; padding: 5px 10px; border-radius: 5px; font-size: 0.85em;">${window.location.origin}/html/wishlist.html?w=${wishlist.wishlistId}</code></p>
    `;
    
    songCount.textContent = wishlist.songs.length;
    songsList.innerHTML = '';
    
    if (wishlist.songs.length === 0) {
        songsList.innerHTML = '<li style="text-align: center; padding: 20px; color: var(--color-text-secondary);">No hay canciones aún</li>';
    } else {
        wishlist.songs.forEach(song => {
            const li = document.createElement('li');
            li.style.cssText = 'background-color: #2c2c2c; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid var(--color-secondary);';
            li.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div style="flex: 1;">
                        <strong style="display: block; color: var(--color-text-primary);">${song.titulo}</strong>
                        <em style="display: block; color: var(--color-text-secondary); font-size: 0.9em;">${song.artista}</em>
                        <small style="color: var(--color-text-secondary);">
                            🎵 ${song.genre} • 
                            👤 ${song.addedBy} • 
                            🕐 ${new Date(song.timestamp).toLocaleString('es-ES')}
                        </small>
                    </div>
                    <button onclick="deleteSong('${wishlist.wishlistId}', '${song._id}')" 
                            style="width: auto; padding: 8px 15px; background-color: var(--color-error);">
                        🗑️
                    </button>
                </div>
            `;
            songsList.appendChild(li);
        });
    }
    
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('wishlist-modal').style.display = 'none';
    document.getElementById('qr-container').style.display = 'none';
    currentWishlist = null;
}

async function toggleWishlistStatus(wishlistId) {
    try {
        const response = await fetch(`${serverUrl}/api/wishlists/${wishlistId}/toggle`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Error al cambiar estado');
        
        alert('✅ Estado actualizado');
        loadWishlists();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cambiar el estado.');
    }
}

async function deleteWishlist(wishlistId) {
    if (!confirm('¿Estás seguro de eliminar esta wishlist? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const response = await fetch(`${serverUrl}/api/wishlists/${wishlistId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Error al eliminar');
        
        alert('✅ Wishlist eliminada');
        loadWishlists();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la wishlist.');
    }
}

async function deleteSong(wishlistId, songId) {
    if (!confirm('¿Eliminar esta canción de la wishlist?')) return;
    
    try {
        const response = await fetch(`${serverUrl}/api/wishlists/${wishlistId}/songs/${songId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Error al eliminar canción');
        
        viewWishlist(wishlistId);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la canción.');
    }
}

function copyLink() {
    if (!currentWishlist) return;
    
    const link = `${window.location.origin}/html/wishlist.html?w=${currentWishlist.wishlistId}`;
    
    navigator.clipboard.writeText(link).then(() => {
        alert('✅ Enlace copiado al portapapeles!');
    }).catch(() => {
        prompt('Copia este enlace:', link);
    });
}

function toggleQR() {
    if (!currentWishlist) return;
    
    const qrContainer = document.getElementById('qr-container');
    const canvas = document.getElementById('wishlist-qr');
    
    if (qrContainer.style.display === 'none') {
        const link = `${window.location.origin}/html/wishlist.html?w=${currentWishlist.wishlistId}`;
        
        QRCode.toCanvas(canvas, link, { width: 300, margin: 2 }, (error) => {
            if (error) {
                console.error(error);
                alert('Error al generar QR');
                return;
            }
            qrContainer.style.display = 'block';
        });
    } else {
        qrContainer.style.display = 'none';
    }
}

function exportToPDF() {
    if (!currentWishlist) return;
    
    // Crear contenido HTML para impresión
    const printWindow = window.open('', '_blank');
    
    const logoSection = companyLogoUrl ? `
        <div style="text-align: center; margin-bottom: 30px;">
            <img src="${companyLogoUrl}" alt="Logo" style="max-width: 250px; max-height: 100px;">
        </div>
    ` : '';
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${currentWishlist.name} - Wishlist</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 40px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                h1 {
                    color: #333;
                    border-bottom: 3px solid #03dac6;
                    padding-bottom: 10px;
                }
                .info {
                    background-color: #f5f5f5;
                    padding: 15px;
                    margin: 20px 0;
                    border-left: 4px solid #bb86fc;
                }
                .song {
                    border-bottom: 1px solid #ddd;
                    padding: 15px 0;
                }
                .song:last-child {
                    border-bottom: none;
                }
                .song-title {
                    font-size: 1.1em;
                    font-weight: bold;
                    color: #333;
                }
                .song-artist {
                    color: #666;
                    font-style: italic;
                }
                .song-meta {
                    font-size: 0.85em;
                    color: #999;
                    margin-top: 5px;
                }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            ${logoSection}
            <h1>🎵 ${currentWishlist.name}</h1>
            
            <div class="info">
                <p><strong>Fecha del evento:</strong> ${currentWishlist.eventDate ? new Date(currentWishlist.eventDate).toLocaleDateString('es-ES') : 'Sin fecha'}</p>
                ${currentWishlist.description ? `<p><strong>Descripción:</strong> ${currentWishlist.description}</p>` : ''}
                <p><strong>Total de canciones:</strong> ${currentWishlist.songs.length}</p>
                <p><strong>Generado:</strong> ${new Date().toLocaleString('es-ES')}</p>
            </div>
            
            <h2>Lista de Canciones</h2>
            
            ${currentWishlist.songs.map((song, index) => `
                <div class="song">
                    <div class="song-title">${index + 1}. ${song.titulo}</div>
                    <div class="song-artist">${song.artista}</div>
                    <div class="song-meta">
                        Género: ${song.genre} | 
                        Sugerido por: ${song.addedBy} | 
                        ${new Date(song.timestamp).toLocaleDateString('es-ES')}
                    </div>
                </div>
            `).join('')}
            
            <div class="no-print" style="margin-top: 40px; text-align: center;">
                <button onclick="window.print()" style="padding: 15px 30px; font-size: 16px; background-color: #03dac6; border: none; border-radius: 8px; cursor: pointer;">
                    📄 Imprimir / Guardar como PDF
                </button>
                <button onclick="window.close()" style="padding: 15px 30px; font-size: 16px; background-color: #666; color: white; border: none; border-radius: 8px; cursor: pointer; margin-left: 10px;">
                    Cerrar
                </button>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
}
