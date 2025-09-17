const Capacitor = window.Capacitor;
const { App, Share, Filesystem } = Capacitor.Plugins;

const token = localStorage.getItem('dj-token');
if (!token) {
    window.location.href = '/html/login.html';
}

const serverUrl = "https://djapp.duckdns.org";

const partySetupSection = document.getElementById('party-setup');
const dashboardContentSection = document.getElementById('dashboard-content');
const createPartyBtn = document.getElementById('create-party-btn');
const partyNameInput = document.getElementById('party-name-input');

async function initialize() {
    const urlParams = new URLSearchParams(window.location.search);
    let partyId = urlParams.get('dj');

    if (!partyId) {
        try {
            const response = await fetch(`${serverUrl}/api/active-party`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                partyId = data.activePartyId;
            }
        } catch (error) {
            console.error('Error al obtener la fiesta activa:', error);
        }
    }
    
    if (partyId) {
        partySetupSection.style.display = 'none';
        dashboardContentSection.style.display = 'block';
        runDashboard(partyId);
    } else {
        partySetupSection.style.display = 'block';
        dashboardContentSection.style.display = 'none';
    }
}

initialize();

if (Capacitor.isNativePlatform()) {
    App.addListener('resume', () => {
        initialize();
    });
}

createPartyBtn.addEventListener('click', () => {
    const customName = partyNameInput.value.trim();
    if (!customName) {
        alert('Por favor, escribe un nombre para la fiesta.');
        return;
    }
    const cleanName = customName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const randomString = Math.random().toString(36).substring(2, 8);
    const uniquePartyId = `${cleanName}-${randomString}`;
    window.location.href = `/html/dj.html?dj=${uniquePartyId}`;
});

function runDashboard(currentPartyId) {
    document.getElementById('dj-name').textContent = `ID del Evento: ${currentPartyId}`;
    const listaCanciones = document.getElementById('lista-canciones');
    const btnNuevaFiesta = document.getElementById('btn-nueva-fiesta');
    const shareQrBtn = document.getElementById('share-qr-btn');
    const qrcodeContainer = document.getElementById('qrcode-container');
    
    const socket = io(serverUrl, { 
        auth: { token }, 
        transports: ["websocket"] 
    });

    socket.on('connect_error', (err) => {
        if (err.message.includes('Authentication error')) {
            localStorage.removeItem('dj-token');
            window.location.href = '/html/login.html';
        }
    });
    
    socket.emit('join-dj-room', currentPartyId);
    
    const createSongItem = (cancion) => {
        const item = document.createElement('li');
        item.className = 'cancion-item';
        item.id = cancion._id;
        if (cancion.played) item.classList.add('played');
        item.innerHTML = `
            <div class="cancion-info">
                <strong>${cancion.titulo}</strong>
                <em>${cancion.artista} (Pedido a las ${cancion.hora})</em>
            </div>
            <button class="btn-played" data-songid="${cancion._id}" ${cancion.played ? 'disabled' : ''}>
                ${cancion.played ? 'Puesta ✓' : 'Marcar Puesta'}
            </button>`;
        return item;
    };

    socket.on('load-initial-songs', (songs) => {
        listaCanciones.innerHTML = '';
        songs.forEach(cancion => listaCanciones.appendChild(createSongItem(cancion)));
    });

    socket.on('recibir-cancion', (cancion) => {
        listaCanciones.prepend(createSongItem(cancion));
    });

    socket.on('song-was-played', (songId) => {
        const item = document.getElementById(songId);
        if (item) {
            item.classList.add('played');
            const button = item.querySelector('.btn-played');
            button.textContent = 'Puesta ✓';
            button.disabled = true;
        }
    });

    listaCanciones.addEventListener('click', (event) => {
        const button = event.target.closest('.btn-played');
        if (button && !button.disabled) {
            const songId = button.getAttribute('data-songid');
            socket.emit('mark-song-as-played', { partyId: currentPartyId, songId: songId });
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
        }
    });
    
    // --- ESTA ES LA LÍNEA CLAVE ---
    const guestUrl = `${serverUrl}/index.html?dj=${currentPartyId}`;
    qrcodeContainer.innerHTML = '';
    const canvas = document.createElement('canvas');
    qrcodeContainer.appendChild(canvas);
    
    QRCode.toCanvas(canvas, guestUrl, { width: 300, margin: 1 }, (error) => {
        if (error) return console.error(error);
        shareQrBtn.style.display = 'block';
    });

    shareQrBtn.onclick = async () => {
        const dataUrl = canvas.toDataURL('image/png');
        
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
        if (confirm('¿Estás seguro de que quieres finalizar esta fiesta?')) {
            try {
                const response = await fetch(`${serverUrl}/api/end-party`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
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