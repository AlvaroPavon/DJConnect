/**
 * =========================================================================
 * ASISTENTE PRE-EVENTOS Y WISHLISTS (wishlist.js)
 * Función: Módulo separado de la experiencia "En Vivo". Permite
 * visualizar, buscar en Spotify y agendar canciones a una lista 
 * cerrada días antes del evento para organizar el repertorio.
 * =========================================================================
 */

const serverUrl = window.SERVER_URL || window.location.origin;
let currentWishlistId = null;
let currentWishlist = null;
let socket = null;

// ==========================================
// CICLO DE ARRANQUE Y LECTURA URL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Escaneo de QR o Link directo con el 'Hash' / ID de la lista
    const urlParams = new URLSearchParams(window.location.search);
    const wishlistId = urlParams.get('w');
    
    if (!wishlistId) {
        showError('❌ Fallo de Vínculo: No encontramos un número de lista apuntando a esta URL.');
        return;
    }
    
    currentWishlistId = wishlistId;
    loadWishlist();        // Atraer datos masivos de MongoDB
    setupEventListeners(); // Mapear escritura y Clicks
    loadCompanyLogo();
    setupSocketIO();       // Websockets pasivos (Solo lectura en tiempo real)
});

/**
 * Socket.IO "Modo Pasivo". Los invitados a una Boda/Evento ven cómo la lista 
 * general va creciendo a medida que otros invitados en otras casas añaden sus canciones.
 */
function setupSocketIO() {
    socket = io(serverUrl);
    
    socket.on('connect', () => {
        socket.emit('join-wishlist-room', currentWishlistId);
    });
    
    // Inyección Reactiva: Un invitado acaba de añadir una canción
    socket.on('wishlist-song-added', (newSong) => {
        console.log('🎵 Canción Externa Inyectada:', newSong);
        if (currentWishlist) {
            currentWishlist.songs.push(newSong);
            displaySongs(currentWishlist.songs); // Re-renderizado total
            updateSongCounter();
        }
    });
    
    // Eliminación Reactiva: El admin purga una canción
    socket.on('wishlist-song-deleted', (songId) => {
        if (currentWishlist) {
            currentWishlist.songs = currentWishlist.songs.filter(song => song._id !== songId);
            displaySongs(currentWishlist.songs);
            updateSongCounter();
        }
    });
}

function updateSongCounter() {
    const counter = document.getElementById('song-counter');
    if (counter && currentWishlist) {
        counter.textContent = currentWishlist.songs.length;
    }
}

/**
 * Lógica asíncrona principal: Pide todos los datos y descripciones que
 * el Admin haya rellenado en su panel y destapa el HTML oculto.
 */
async function loadWishlist() {
    try {
        const response = await fetch(`${serverUrl}/api/wishlists/${currentWishlistId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                showError('El organizador(DJ) ha cerrado definitivamente esta lista.');
            } else {
                showError('Error masivo al levantar archivo. Prueba tu WiFi.');
            }
            return; // Bloqueo de avance
        }
        
        // Asimilación de datos a variable Root
        currentWishlist = await response.json();
        const wl = currentWishlist;

        document.getElementById('loading').style.display = 'none';
        document.getElementById('error-message').style.display = 'none';
        
        // Activa la consola si la lista sigue abierta
        document.getElementById('wishlist-content').style.display = wl.isActive ? 'block' : 'none';
        
        if (!wl.isActive) {
            showError('El DJ ha bloqueado esta lista y ya está imprimiendo el repertorio oficial.');
            return;
        }

        // --- Relleno de Componentes DOM ---
        document.getElementById('wishlist-title').innerHTML = `<span style="font-size: 0.8em; opacity: 0.6">Setlist de:</span><br/>🎵 ${wl.name} 🎵`;
        
        const infoSection = document.getElementById('wishlist-info');
        
        if (wl.description) {
            document.getElementById('wishlist-description').textContent = `"${wl.description}"`;
            infoSection.style.display = 'block';
        }
        
        if (wl.eventDate) {
            const date = new Date(wl.eventDate).toLocaleDateString('es-ES', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long'
            });
            document.getElementById('wishlist-date').innerHTML = `<span style="opacity:0.6">Para el:</span> ${date}`;
            infoSection.style.display = 'block';
        }
        
        updateSongCounter();
        displaySongs(wl.songs);
        
    } catch (error) {
        console.error('Interrupción AJAX:', error);
        showError('Falla Crítica de Red. No conseguimos enlazar con DJConnect.');
    }
}

/**
 * Renderizador Premium (.stats-card) de la cuadrilla inferior donde se lista "Lo que ya se ha pedido".
 */
function displaySongs(songs) {
    const songsList = document.getElementById('songs-list');
    
    if (songs.length === 0) {
        songsList.innerHTML = '<li style="text-align: center; color: var(--color-text-secondary); padding: 25px;">Lista puramente en blanco.</li>';
        return;
    }
    
    songsList.innerHTML = '';
    // Mapeamos array a DOM objects
    songs.forEach(song => {
        const li = document.createElement('li');
        li.className = 'animate-fade-in';
        li.style.cssText = `
            background: rgba(255, 255, 255, 0.03); 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 8px; 
            border-left: 3px solid var(--color-primary);
            display: flex;
            flex-direction: column;
            gap: 5px;
        `;
        li.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <strong style="color: #fff; font-size: 1.1em; max-width: 80%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${song.titulo}</strong>
                <span style="background: rgba(0,0,0,0.5); font-size: 0.75em; padding: 3px 8px; border-radius: 12px; color: var(--color-accent);">${song.genre || 'Pista'}</span>
            </div>
            <em style="color: var(--color-text-secondary); font-size: 0.9em;">👤 ${song.artista}</em>
            <small style="color: var(--color-text-secondary); opacity: 0.6; margin-top: 5px; font-style: italic;">
                🙋🏽 Aportada por: ${song.addedBy || 'Invitado/a Anónimo'}
            </small>
        `;
        songsList.appendChild(li);
    });
}

function setupEventListeners() {
    // ===========================================
    // BÚSQUEDA AUTOMÁTICA EN LA WEB (SPOTIFY)
    // ===========================================
    const searchInput = document.getElementById('search-input');
    const suggestionsList = document.getElementById('suggestions');
    let searchTimeout;
    
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const query = searchInput.value;
        
        if (query.trim().length < 3) {
            suggestionsList.innerHTML = '';
            return;
        }
        
        searchTimeout = setTimeout(async () => {
            try {
                suggestionsList.innerHTML = '<li style="text-align:center; color:var(--color-secondary); padding: 10px;">Inspeccionando bibliotecas...</li>';
                const res = await fetch(`${serverUrl}/api/search?q=${encodeURIComponent(query)}`);
                const songs = await res.json();
                
                suggestionsList.innerHTML = '';
                if(songs.length === 0){
                    suggestionsList.innerHTML = '<li style="text-align:center; color:var(--color-error); padding: 10px;">Nada encontrado. Cárgala manualmente.</li>';
                    return;
                }

                songs.forEach(song => {
                    const item = document.createElement('li');
                    item.className = 'animate-fade-in';
                    item.style.cssText = `
                        background: var(--color-surface);
                        border: 1px solid rgba(255,255,255,0.1);
                        padding: 12px; margin-bottom: 5px;
                        border-radius: 5px; cursor: pointer;
                        display: flex; justify-content: space-between; align-items: center;
                    `;
                    item.dataset.titulo = song.titulo;
                    item.dataset.artista = song.artista;
                    item.dataset.genre = song.genre || 'Desconocido';
                    
                    item.innerHTML = `
                        <div>
                            <strong style="color:var(--color-text-primary);">${song.titulo}</strong><br>
                            <em style="font-size:0.85em; color:var(--color-text-secondary);">Autor: ${song.artista}</em>
                        </div>
                        <span style="font-size: 1.2rem;">➕</span>
                    `;
                    suggestionsList.appendChild(item);
                });
            } catch (err) {
                console.error(err);
                suggestionsList.innerHTML = '';
            }
        }, 500);
    });
    
    // Capturador del Click de añadir
    suggestionsList.addEventListener('click', (event) => {
        const item = event.target.closest('li');
        if (item && item.dataset.titulo) {
            
            // Falso estado visual de carga
            item.style.background = 'rgba(76, 175, 80, 0.4)';
            item.innerHTML = '<div style="width:100%; text-align:center; color:white; font-weight:bold;">¡Añadiendo a la lista! 🔄</div>';

            const songObj = {
                titulo: item.dataset.titulo,
                artista: item.dataset.artista,
                genre: item.dataset.genre,
                addedBy: 'Interactivo Web' // Nombre genérico
            };
            
            setTimeout(() => addSongToWishlist(songObj), 500);
        }
    });

    // ===========================================
    // AÑADIR VÍA FORMULARIO A MOTOR (MANUAL)
    // ===========================================
    document.getElementById('manual-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnSubmit = document.querySelector('#manual-form button');
        const oldText = btnSubmit.innerHTML;
        btnSubmit.innerHTML = 'Enviando... ⏳';
        btnSubmit.disabled = true;

        const song = {
            titulo: document.getElementById('manual-title').value.trim(),
            artista: document.getElementById('manual-artist').value.trim(),
            genre: 'Desconocido (Manual)',
            addedBy: document.getElementById('manual-name').value.trim() || 'Invitado Directo'
        };
        
        if (!song.titulo || !song.artista) {
            alert('❌ Faltan datos (Título o Autor).');
            btnSubmit.innerHTML = oldText;
            btnSubmit.disabled = false;
            return;
        }
        
        await addSongToWishlist(song);
        
        document.getElementById('manual-form').reset();
        btnSubmit.innerHTML = oldText;
        btnSubmit.disabled = false;
    });
}

/**
 * El inyector de la API RESTFUL. Toma un song object asíncrono e intenta guardarlo
 * validando siempre posibles cierres de listas en medio de la operación.
 */
async function addSongToWishlist(song) {
    try {
        const response = await fetch(`${serverUrl}/api/wishlists/${currentWishlistId}/songs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(song)
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                alert('⏳ Llegas tarde: La Wishlist la ha cerrado el DJ.');
                location.reload(); // Forzamos carga para mostrar la view de lista cerrada
            } else {
                throw new Error('Fallback Backend DB');
            }
            return;
        }
        
        // Limpiar buscador para no dejar rastro y prevenir multiclicks
        document.getElementById('search-input').value = '';
        document.getElementById('suggestions').innerHTML = '';
        
        // Lanza Pop-up holográfico Neon Verde
        document.getElementById('success-modal').style.display = 'flex';
        
        // Las canciones NO se repintan visualmente aquí, lo hará socket.on('wishlist-song-added')
        
    } catch (error) {
        console.error('Crash Inserción de Wishlist:', error);
        alert('❌ Imposible contactar con servidor. Canción no guardada.');
    }
}

// Interfaz para colapso o errores de página
function showError(msg) {
    document.getElementById('loading').style.display = 'none';
    const errorCont = document.getElementById('error-message');
    errorCont.style.display = 'block';
    // Le quitamos el formato stats-panel para forzar visibilidad de alerta roja
    errorCont.className = ''; 
    errorCont.style.cssText = 'padding: 30px; border-radius: 12px; background: rgba(255, 0, 0, 0.1); border: 2px solid var(--color-error); text-align: center; margin: 20px 0;';
    
    document.getElementById('error-text').innerHTML = `<h3 style="color:var(--color-error)">Acceso Restringido</h3>${msg}`;
    document.getElementById('wishlist-content').style.display = 'none';
    document.getElementById('wishlist-info').style.display = 'none';
}

async function loadCompanyLogo() {
    try {
        const res = await fetch(`${serverUrl}/api/config/logo`);
        const data = await res.json();
        if (data.logoUrl) {
            const logo = document.getElementById('company-logo');
            logo.src = data.logoUrl;
            logo.style.display = 'block';
        }
    } catch(e) {}
}
