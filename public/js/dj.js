// Capacitor detection y importación segura
const Capacitor = window.Capacitor || { isNativePlatform: () => false };
const App = window.CapacitorApp || null;
const Share = window.CapacitorShare || null;
const Filesystem = window.CapacitorFilesystem || null;

const token = localStorage.getItem('dj-token');
if (!token) {
    window.location.href = '/html/login.html';
}

const serverUrl = window.SERVER_URL || window.location.origin;

// --- Seleccion de elementos del DOM ---
const mainMenuSection = document.getElementById('main-menu');
const dashboardContentSection = document.getElementById('dashboard-content');
const createPartyBtn = document.getElementById('create-party-btn');
const partyNameInput = document.getElementById('party-name-input');
const joinActivePartyBtn = document.getElementById('join-active-party-btn');

let activePartyId = null;
let activePartyIds = [];

// --- 1. INICIALIZACIÓN: Carga el menú principal ---
async function initialize() {
    // Cargar logo de la empresa
    loadCompanyLogo();
    
    // Cargar perfil del DJ (incluyendo Instagram)
    loadDJProfile();
    
    // Comprobar si ya hay fiestas activas en el backend
    try {
        const response = await fetch(`${serverUrl}/api/active-party`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            activePartyIds = data.activePartyIds || [];
            
            // Mostrar las fiestas activas
            if (activePartyIds.length > 0) {
                displayActiveParties(activePartyIds);
            }
            
            // Mostrar/ocultar mensaje de límite
            const limitMessage = document.getElementById('party-limit-message');
            const createBtn = document.getElementById('create-party-btn');
            if (activePartyIds.length >= 3) {
                limitMessage.style.display = 'block';
                createBtn.disabled = true;
                createBtn.style.opacity = '0.5';
            } else {
                limitMessage.style.display = 'none';
                createBtn.disabled = false;
                createBtn.style.opacity = '1';
            }
        }
    } catch (error) {
        console.error('Error al obtener las fiestas activas:', error);
    }

    // Asegurarse de que el menú es visible y el dashboard oculto
    mainMenuSection.style.display = 'block';
    dashboardContentSection.style.display = 'none';

    // Configurar los listeners del menú
    setupMenuListeners();
}

// Cargar perfil del DJ
async function loadDJProfile() {
    try {
        const response = await fetch(`${serverUrl}/api/dj/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const profile = await response.json();
            const instagramInput = document.getElementById('instagram-input');
            if (instagramInput && profile.instagram) {
                instagramInput.value = profile.instagram;
            }
        }
    } catch (error) {
        console.error('Error al cargar perfil:', error);
    }
}

// Mostrar lista de fiestas activas
function displayActiveParties(partyIds) {
    const section = document.getElementById('active-parties-section');
    const count = document.getElementById('active-parties-count');
    const list = document.getElementById('active-parties-list');
    
    count.textContent = partyIds.length;
    section.style.display = 'block';
    
    list.innerHTML = '';
    partyIds.forEach((partyId, index) => {
        const partyDiv = document.createElement('div');
        partyDiv.style.cssText = 'background-color: #2c2c2c; padding: 12px; margin: 8px 0; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; border-left: 3px solid var(--color-secondary);';
        partyDiv.innerHTML = `
            <div>
                <strong style="color: var(--color-text-primary);">${partyId}</strong>
                <small style="display: block; color: var(--color-text-secondary); margin-top: 5px;">Fiesta #${index + 1}</small>
            </div>
            <button onclick="joinParty('${partyId}')" style="width: auto; padding: 8px 15px; background-color: var(--color-primary); margin: 0;">
                🎧 Entrar
            </button>
        `;
        list.appendChild(partyDiv);
    });
}

// Función para unirse a una fiesta específica
function joinParty(partyId) {
    activePartyId = partyId;
    mainMenuSection.style.display = 'none';
    dashboardContentSection.style.display = 'block';
    runDashboard(partyId);
}

// Función para cargar el logo de la empresa
async function loadCompanyLogo() {
    try {
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

// --- 2. LISTENERS DEL MENÚ ---
function setupMenuListeners() {
    // Listener para el botón "Crear Nueva Fiesta"
    createPartyBtn.addEventListener('click', () => {
        const customName = partyNameInput.value.trim();
        if (!customName) {
            alert('Por favor, escribe un nombre para la fiesta.');
            return;
        }
        
        // Verificar límite
        if (activePartyIds.length >= 3) {
            alert('Has alcanzado el límite de 3 fiestas simultáneas. Finaliza una antes de crear otra.');
            return;
        }

        const cleanName = customName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const randomString = Math.random().toString(36).substring(2, 8);
        const uniquePartyId = `${cleanName}-${randomString}`;
        
        // Ocultar menú y mostrar dashboard con la NUEVA fiesta
        mainMenuSection.style.display = 'none';
        dashboardContentSection.style.display = 'block';
        runDashboard(uniquePartyId);
    });

    // Listener para el botón "Cerrar Sesión"
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                localStorage.removeItem('dj-token');
                window.location.href = '/html/login.html';
            }
        });
    }

    // Listener para el formulario de Instagram
    const instagramForm = document.getElementById('instagram-form');
    if (instagramForm) {
        instagramForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const instagramInput = document.getElementById('instagram-input');
            const instagramStatus = document.getElementById('instagram-status');
            const instagram = instagramInput.value.trim().replace('@', '');
            
            try {
                const response = await fetch(`${serverUrl}/api/dj/instagram`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ instagram })
                });
                
                if (response.ok) {
                    instagramStatus.textContent = '✅ Instagram guardado correctamente';
                    instagramStatus.style.color = 'var(--color-secondary)';
                    instagramStatus.style.display = 'block';
                    
                    setTimeout(() => {
                        instagramStatus.style.display = 'none';
                    }, 3000);
                } else {
                    throw new Error('Error al guardar');
                }
            } catch (error) {
                console.error('Error:', error);
                instagramStatus.textContent = '❌ Error al guardar Instagram';
                instagramStatus.style.color = 'var(--color-error)';
                instagramStatus.style.display = 'block';
            }
        });
    }
}

// Iniciar la lógica del menú al cargar la página
initialize();

if (Capacitor.isNativePlatform()) {
    App.addListener('resume', () => {
        // Al volver a la app nativa, siempre actualizamos
        initialize();
    });
}

// BFCache fix para navegadores web cuando se dale "Atrás" en el historial
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        initialize();
    }
});


// --- 3. LÓGICA DEL DASHBOARD (La fiesta en sí) ---
// (Esta función solo se llama cuando haces clic en "Crear" o "Unirse")
function runDashboard(currentPartyId) {
    document.getElementById('dj-name').textContent = `ID del Evento: ${currentPartyId}`;
    const listaCanciones = document.getElementById('lista-canciones');
    const btnNuevaFiesta = document.getElementById('btn-nueva-fiesta');
    const shareQrBtn = document.getElementById('share-qr-btn');
    const qrcodeContainer = document.getElementById('qrcode-container');
    
    // ===== NUEVO BOTÓN DE VOLVER AL MENÚ =====
    const backToMenuBtn = document.getElementById('back-to-menu-btn');
    
    const socket = io(serverUrl, { 
        auth: { token }, 
        transports: ["websocket"] 
    });

    // ===== LISTENER DEL BOTÓN DE VOLVER =====
    backToMenuBtn.addEventListener('click', () => {
        // 1. Desconectar el socket de esta fiesta
        if(socket) socket.disconnect();
        
        // 2. Ocultar el dashboard
        dashboardContentSection.style.display = 'none';
        
        // 3. Mostrar el menú principal
        mainMenuSection.style.display = 'block';
        
        // 4. Refrescar datos cruciales (soluciona bug de "no aparecen fiestas creadas")
        initialize();
    });
    // ========================================

    socket.on('connect_error', (err) => {
        if (err.message.includes('Authentication error')) {
            localStorage.removeItem('dj-token');
            window.location.href = '/html/login.html';
        }
    });
    
    socket.emit('join-dj-room', currentPartyId);
    
    let allSongs = [];
    
    const updateStats = () => {
        const visibleSongs = allSongs.filter(s => !s.hidden);
        document.getElementById('total-songs').textContent = visibleSongs.length;
        
        // Calcular géneros
        const genreCounts = {};
        visibleSongs.forEach(song => {
            const genre = song.genre || 'Desconocido';
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
        
        // Ordenar por cantidad
        const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);
        const topGenre = sortedGenres.length > 0 ? sortedGenres[0][0] : '-';
        document.getElementById('top-genre').textContent = topGenre;
        
        // Mostrar badges de géneros
        const genreStatsDiv = document.getElementById('genre-stats');
        genreStatsDiv.innerHTML = '';
        sortedGenres.forEach(([genre, count], index) => {
            const badge = document.createElement('div');
            badge.className = index === 0 ? 'genre-badge top' : 'genre-badge';
            badge.textContent = `${genre}: ${count}`;
            genreStatsDiv.appendChild(badge);
        });
    };
    
    const createSongItem = (cancion) => {
        const item = document.createElement('li');
        item.className = 'cancion-item';
        item.id = cancion._id;
        if (cancion.played) item.classList.add('played');
        
        const genreTag = cancion.genre && cancion.genre !== 'Desconocido' 
            ? `<span class="genre-tag">🎵 ${cancion.genre}</span>` 
            : '';
        
        item.innerHTML = `
            <div class="cancion-info">
                <strong>${cancion.titulo}</strong>
                <em>${cancion.artista} (Pedido a las ${cancion.hora})</em>
                ${genreTag}
            </div>
            <div class="cancion-actions">
                <button class="btn-played" data-songid="${cancion._id}" ${cancion.played ? 'disabled' : ''}>
                    ${cancion.played ? 'Puesta ✓' : 'Marcar Puesta'}
                </button>
                <button class="btn-hide" data-songid="${cancion._id}">
                    🗑️ Ocultar
                </button>
            </div>`;
        return item;
    };

    socket.on('load-initial-songs', (songs) => {
        allSongs = songs.filter(s => !s.hidden);
        listaCanciones.innerHTML = '';
        allSongs.forEach(cancion => listaCanciones.appendChild(createSongItem(cancion)));
        updateStats();
    });

    socket.on('recibir-cancion', (cancion) => {
        if (!cancion.hidden) {
            allSongs.unshift(cancion);
            listaCanciones.prepend(createSongItem(cancion));
            updateStats();
        }
    });

    socket.on('song-was-played', (songId) => {
        const item = document.getElementById(songId);
        if (item) {
            item.classList.add('played');
            const button = item.querySelector('.btn-played');
            button.textContent = 'Puesta ✓';
            button.disabled = true;
            
            const song = allSongs.find(s => s._id === songId);
            if (song) song.played = true;
        }
    });

    socket.on('song-was-hidden', (songId) => {
        const item = document.getElementById(songId);
        if (item) {
            item.classList.add('removing');
            item.addEventListener('animationend', () => {
                item.remove();
                allSongs = allSongs.filter(s => s._id !== songId);
                updateStats();
            });
        }
    });

    listaCanciones.addEventListener('click', (event) => {
        const playedButton = event.target.closest('.btn-played');
        const hideButton = event.target.closest('.btn-hide');
        
        if (playedButton && !playedButton.disabled) {
            const songId = playedButton.getAttribute('data-songid');
            socket.emit('mark-song-as-played', { partyId: currentPartyId, songId: songId });
        }
        
        if (hideButton) {
            const songId = hideButton.getAttribute('data-songid');
            if (confirm('¿Ocultar esta canción? Se mantendrá en la base de datos para estadísticas.')) {
                socket.emit('hide-song', { partyId: currentPartyId, songId: songId });
            }
        }
    });

    btnNuevaFiesta.addEventListener('click', () => {
        if (confirm('¿Seguro que quieres limpiar la vista de peticiones? Esto no las borrará de la base de datos.')) {
            const songItems = listaCanciones.querySelectorAll('.cancion-item');
            if (songItems.length === 0) return;
            songItems.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add('removing');
                    item.addEventListener('animationend', () => item.remove());
                }, index * 50);
            });
            allSongs = [];
            updateStats();
        }
    });
    
    const guestUrl = `${serverUrl}/index.html?dj=${currentPartyId}`;
    qrcodeContainer.innerHTML = '';
    const canvas = document.createElement('canvas');
    qrcodeContainer.appendChild(canvas);
    
    QRCode.toCanvas(canvas, guestUrl, { width: 300, margin: 1 }, (error) => {
        if (error) return console.error(error);
        shareQrBtn.style.display = 'block';
    });

    shareQrBtn.onclick = async () => {
        // Generar plantilla completa con QR, texto e Instagram
        const templateCanvas = await generateQRTemplate(canvas, currentPartyId);
        const dataUrl = templateCanvas.toDataURL('image/png');
        
        if (Capacitor.isNativePlatform()) {
            try {
                const result = await Filesystem.writeFile({
                    path: `qr-${currentPartyId}.png`,
                    data: dataUrl,
                    directory: 'CACHE'
                });

                await Share.share({
                    title: `Código QR para la fiesta ${currentPartyId}`,
                    text: 'Escanea este código para pedir canciones.',
                    url: result.uri,
                });
            } catch (error) {
                console.error("Error al compartir el archivo", error);
                alert("No se pudo compartir el QR.");
            }
        } else {
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `qr-fiesta-${currentPartyId}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    const endPartyBtn = document.getElementById('end-party-btn');
    endPartyBtn.addEventListener('click', async () => {
        if (confirm('¿Estás seguro de que quieres finalizar esta fiesta? Se guardarán todas las estadísticas.')) {
            try {
                const response = await fetch(`${serverUrl}/api/end-party`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({ partyId: currentPartyId })
                });

                if (response.ok) {
                    alert('¡Fiesta finalizada! Las estadísticas se han guardado.');
                    window.location.href = '/html/dj.html';
                } else {
                    const errorData = await response.json();
                    alert(`Error al finalizar la fiesta: ${errorData.message || 'Respuesta no válida del servidor.'}`);
                }
            } catch (error) {
                console.error('Error de red al finalizar la fiesta:', error);
                alert('No se pudo finalizar la fiesta. Revisa tu conexión.');
            }
        }
    });
}

// Función para generar la plantilla del QR con texto e Instagram
async function generateQRTemplate(qrCanvas, partyId) {
    // Crear canvas de plantilla (tamaño A4 vertical: 794x1123 px aproximadamente)
    const templateCanvas = document.createElement('canvas');
    const ctx = templateCanvas.getContext('2d');
    
    // Dimensiones optimizadas para impresión y móvil
    templateCanvas.width = 800;
    templateCanvas.height = 1000;
    
    // Fondo blanco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, templateCanvas.width, templateCanvas.height);
    
    try {
        // Cargar logo de la empresa si existe
        const logoResponse = await fetch(`${serverUrl}/api/config/logo`);
        if (logoResponse.ok) {
            const logoData = await logoResponse.json();
            if (logoData.logoUrl) {
                const logoImg = new Image();
                logoImg.crossOrigin = 'anonymous';
                
                await new Promise((resolve, reject) => {
                    logoImg.onload = resolve;
                    logoImg.onerror = resolve; // Continuar aunque falle
                    logoImg.src = logoData.logoUrl;
                });
                
                if (logoImg.complete && logoImg.naturalWidth > 0) {
                    // Calcular dimensiones para centrar el logo
                    const maxLogoWidth = 250;
                    const maxLogoHeight = 100;
                    let logoWidth = logoImg.naturalWidth;
                    let logoHeight = logoImg.naturalHeight;
                    
                    // Escalar manteniendo proporción
                    if (logoWidth > maxLogoWidth) {
                        logoHeight = (maxLogoWidth / logoWidth) * logoHeight;
                        logoWidth = maxLogoWidth;
                    }
                    if (logoHeight > maxLogoHeight) {
                        logoWidth = (maxLogoHeight / logoHeight) * logoWidth;
                        logoHeight = maxLogoHeight;
                    }
                    
                    // Dibujar logo centrado en la parte superior
                    const logoX = (templateCanvas.width - logoWidth) / 2;
                    ctx.drawImage(logoImg, logoX, 40, logoWidth, logoHeight);
                }
            }
        }
    } catch (error) {
        console.log('Logo no disponible, continuando sin logo');
    }
    
    // Texto principal: "Escanea el QR para pedir tu canción"
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 42px Arial, sans-serif';
    ctx.textAlign = 'center';
    
    // Dividir el texto en dos líneas para mejor legibilidad
    const line1 = 'Escanea el QR';
    const line2 = 'para pedir tu canción';
    
    ctx.fillText(line1, templateCanvas.width / 2, 230);
    ctx.fillText(line2, templateCanvas.width / 2, 285);
    
    // Dibujar el QR centrado
    const qrSize = 450;
    const qrX = (templateCanvas.width - qrSize) / 2;
    const qrY = 330;
    
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
    
    // Obtener Instagram del DJ
    try {
        const profileResponse = await fetch(`${serverUrl}/api/dj/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (profileResponse.ok) {
            const profile = await profileResponse.json();
            
            if (profile.instagram) {
                // Dibujar Instagram debajo del QR
                ctx.fillStyle = '#E4405F'; // Color de Instagram
                ctx.font = 'bold 36px Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`@${profile.instagram}`, templateCanvas.width / 2, qrY + qrSize + 60);
                
                // Icono de Instagram (emoji)
                ctx.font = '40px Arial';
                ctx.fillText('📷', templateCanvas.width / 2 - 150, qrY + qrSize + 60);
            }
        }
    } catch (error) {
        console.log('Instagram no disponible');
    }
    
    // Agregar borde decorativo
    ctx.strokeStyle = '#bb86fc';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, templateCanvas.width - 40, templateCanvas.height - 40);
    
    return templateCanvas;
}