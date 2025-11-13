const serverUrl = window.SERVER_URL || window.location.origin;
let currentWishlistId = null;
let currentWishlist = null;
let socket = null;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const wishlistId = urlParams.get('w');
    
    if (!wishlistId) {
        showError('No se proporcionó un ID de wishlist válido.');
        return;
    }
    
    currentWishlistId = wishlistId;
    loadWishlist();
    setupEventListeners();
    loadCompanyLogo();
    setupSocketIO();
});

// Configurar Socket.IO para actualizaciones en tiempo real
function setupSocketIO() {
    socket = io(serverUrl);
    
    socket.on('connect', () => {
        console.log('✅ Conectado a Socket.IO');
        socket.emit('join-wishlist-room', currentWishlistId);
    });
    
    // Escuchar cuando se agrega una canción
    socket.on('wishlist-song-added', (newSong) => {
        console.log('🎵 Nueva canción recibida:', newSong);
        if (currentWishlist) {
            currentWishlist.songs.push(newSong);
            displaySongs(currentWishlist.songs);
            updateSongCounter();
        }
    });
    
    // Escuchar cuando se elimina una canción
    socket.on('wishlist-song-deleted', (songId) => {
        console.log('🗑️ Canción eliminada:', songId);
        if (currentWishlist) {
            currentWishlist.songs = currentWishlist.songs.filter(song => song._id !== songId);
            displaySongs(currentWishlist.songs);
            updateSongCounter();
        }
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Desconectado de Socket.IO');
    });
}

// Actualizar contador de canciones
function updateSongCounter() {
    const counter = document.getElementById('song-counter');
    if (counter && currentWishlist) {
        counter.textContent = currentWishlist.songs.length;
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

function setupEventListeners() {
    // Búsqueda de canciones
    const searchInput = document.getElementById('search-input');
    let searchTimeout;
    
    searchInput.addEventListener('keyup', () => {
        clearTimeout(searchTimeout);
        const query = searchInput.value;
        
        if (query.length < 3) {
            document.getElementById('suggestions').innerHTML = '';
            return;
        }
        
        searchTimeout = setTimeout(async () => {
            await searchSongs(query);
        }, 300);
    });
    
    // Selección de sugerencia
    document.getElementById('suggestions').addEventListener('click', (event) => {
        const listItem = event.target.closest('li');
        if (listItem) {
            const song = {
                titulo: listItem.dataset.titulo,
                artista: listItem.dataset.artista,
                genre: listItem.dataset.genre
            };
            addSongToWishlist(song);
        }
    });
    
    // Formulario manual
    document.getElementById('manual-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const song = {
            titulo: document.getElementById('manual-title').value.trim(),
            artista: document.getElementById('manual-artist').value.trim(),
            genre: 'Desconocido',
            addedBy: document.getElementById('manual-name').value.trim() || 'Invitado'
        };
        
        if (!song.titulo || !song.artista) {
            alert('Por favor, completa título y artista.');
            return;
        }
        
        await addSongToWishlist(song);
        document.getElementById('manual-form').reset();
    });
}

async function loadWishlist() {
    try {
        const response = await fetch(`${serverUrl}/api/wishlists/${currentWishlistId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                showError('Esta wishlist no existe o ha sido cerrada por el DJ.');
            } else {
                showError('Error al cargar la wishlist. Intenta de nuevo más tarde.');
            }
            return;
        }
        
        currentWishlist = await response.json();
        displayWishlist(currentWishlist);
        
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión. Verifica tu internet e intenta de nuevo.');
    }
}

function displayWishlist(wishlist) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('wishlist-content').style.display = 'block';
    
    // Título
    document.getElementById('wishlist-title').textContent = `🎵 ${wishlist.name}`;
    
    // Info
    const infoSection = document.getElementById('wishlist-info');
    if (wishlist.description) {
        document.getElementById('wishlist-description').textContent = wishlist.description;
        infoSection.style.display = 'block';
    }
    
    if (wishlist.eventDate) {
        const date = new Date(wishlist.eventDate).toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        document.getElementById('wishlist-date').textContent = `📅 Evento: ${date}`;
        infoSection.style.display = 'block';
    }
    
    // Contador de canciones
    document.getElementById('song-counter').textContent = wishlist.songs.length;
    
    // Lista de canciones
    displaySongs(wishlist.songs);
}

function displaySongs(songs) {
    const songsList = document.getElementById('songs-list');
    
    if (songs.length === 0) {
        songsList.innerHTML = '<li style="text-align: center; padding: 20px; color: var(--color-text-secondary);">No hay canciones aún. ¡Sé el primero en sugerir!</li>';
        return;
    }
    
    songsList.innerHTML = '';
    songs.forEach(song => {
        const li = document.createElement('li');
        li.style.cssText = 'background-color: #2c2c2c; padding: 12px; margin: 8px 0; border-radius: 5px; border-left: 3px solid var(--color-secondary);';
        li.innerHTML = `
            <strong style="display: block; color: var(--color-text-primary);">${song.titulo}</strong>
            <em style="display: block; color: var(--color-text-secondary); font-size: 0.9em;">${song.artista}</em>
            <small style="color: var(--color-text-secondary);">
                🎵 ${song.genre} • 
                👤 ${song.addedBy}
            </small>
        `;
        songsList.appendChild(li);
    });
}

async function searchSongs(query) {
    try {
        const response = await fetch(`${serverUrl}/api/search?q=${encodeURIComponent(query)}`);
        const songs = await response.json();
        
        const suggestionsList = document.getElementById('suggestions');
        suggestionsList.innerHTML = '';
        
        songs.forEach(song => {
            const item = document.createElement('li');
            item.dataset.titulo = song.titulo;
            item.dataset.artista = song.artista;
            item.dataset.genre = song.genre || 'Desconocido';
            item.textContent = `${song.titulo} - ${song.artista}`;
            suggestionsList.appendChild(item);
        });
    } catch (error) {
        console.error('Error al buscar canciones:', error);
    }
}

async function addSongToWishlist(song) {
    try {
        const response = await fetch(`${serverUrl}/api/wishlists/${currentWishlistId}/songs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                titulo: song.titulo,
                artista: song.artista,
                genre: song.genre || 'Desconocido',
                addedBy: song.addedBy || 'Invitado'
            })
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                alert('Esta wishlist ha sido cerrada por el DJ.');
            } else {
                throw new Error('Error al agregar canción');
            }
            return;
        }
        
        // Limpiar búsqueda
        document.getElementById('search-input').value = '';
        document.getElementById('suggestions').innerHTML = '';
        
        // Mostrar modal de éxito
        document.getElementById('success-modal').style.display = 'flex';
        
        // NO recargar - Socket.IO actualizará automáticamente
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al agregar la canción. Intenta de nuevo.');
    }
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error-message').style.display = 'block';
    document.getElementById('error-text').textContent = message;
}
