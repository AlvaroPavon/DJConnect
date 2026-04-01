/**
 * =========================================================================
 * ARCHIVO PRINCIPAL DEL CLIENTE INVITADO EN VIVO (index.js)
 * Función: Permite a los invitados buscar canciones (API Spotify interna)
 * pulsarlas, y mandarlas al DJ a través de WebSockets, apareciendo al 
 * instante la ventana de valoración.
 * =========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. CONFIGURACIÓN ENTORNO Y COMUNICACIÓN SOCKET.IO
    const serverUrl = window.SERVER_URL || window.location.origin;
    
    // Conexión robusta sin HTTP Polling (Latencia ultrabaja requerida para salas en directo)
    const socket = io(serverUrl, { transports: ["websocket"] });

    // 2. CONEXIÓN AL DOM
    const searchInput = document.getElementById('search-input');
    const suggestionsList = document.getElementById('suggestions');
    const ratingModal = document.getElementById('rating-modal');
    const stars = document.querySelectorAll('.stars span');

    // 3. IDENTIFICACIÓN DE SALA / FIESTA
    const urlParams = new URLSearchParams(window.location.search);
    const salaId = urlParams.get('dj'); 

    // Mecanismo anti-intrusos: Si no entraron leyendo un QR o link de fiesta saltan al login
    if (!salaId) {
        window.location.href = '/html/login.html';
        return;
    }

    // 4. MOTOR DE BÚSQUEDA REACTIVO
    let searchTimeout;
    searchInput.addEventListener('input', () => { // Usamos input en vez de keyup para mejor control en móviles
        clearTimeout(searchTimeout);
        const query = searchInput.value;

        // Auto-limpieza en caso de querer borrar todo
        if (query.trim().length < 3) {
            suggestionsList.innerHTML = ''; 
            return;
        }

        // Debounce: 300ms de retraso para no quemar cuota en Spotify API
        searchTimeout = setTimeout(async () => {
            try {
                // Estado de carga elegante (opcional visualmente en la UI Neon)
                suggestionsList.innerHTML = '<li style="text-align: center; color: var(--color-accent); padding: 15px;">Buscando frecuencias... ⏳</li>';
                
                const response = await fetch(`${serverUrl}/api/search?q=${encodeURIComponent(query)}`);
                const songs = await response.json();
                
                // Limpieza del loader y pintado
                suggestionsList.innerHTML = '';
                
                if(songs.length === 0) {
                    suggestionsList.innerHTML = '<li style="text-align: center; color: var(--color-error); padding: 15px;">Sin resultados. Prueba otra combinación.</li>';
                    return;
                }

                songs.forEach(song => {
                    // Diseño Neon para las opciones de canción
                    const item = document.createElement('li');
                    item.className = 'animate-fade-in';
                    item.style.cssText = `
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 8px;
                        padding: 15px;
                        margin-bottom: 10px;
                        cursor: pointer;
                        transition: background-color 0.2s;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    `;

                    // Guardado en memoria HTML Dataset para capturarlo al Clickear
                    item.dataset.titulo = song.titulo;
                    item.dataset.artista = song.artista;
                    item.dataset.genre = song.genre || 'Desconocido';
                    
                    // Frontend interior de la ficha de música
                    item.innerHTML = `
                        <div style="flex: 1; min-width: 0; padding-right: 10px;">
                            <strong style="color: var(--color-text-primary); display: block; font-size: 1.1em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${song.titulo}</strong>
                            <em style="color: var(--color-text-secondary); display: block; font-size: 0.9em; margin-top: 4px;">👤 ${song.artista}</em>
                        </div>
                        <div style="flex-shrink: 0;">
                            <span style="background: var(--color-primary); color: white; padding: 5px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold;">Pedir 🎵</span>
                        </div>
                    `;
                    
                    suggestionsList.appendChild(item);
                });
            } catch (error) {
                console.error('Fallo del subsistema API Search:', error);
                suggestionsList.innerHTML = '<li style="text-align: center; color: var(--color-error); padding: 15px;">Servidor no responde.</li>';
            }
        }, 300);
    });

    // 5. CAZADOR DE PETICIONES E INTERFAZ UI (Delegación al click)
    suggestionsList.addEventListener('click', (event) => {
        const listItem = event.target.closest('li');
        if (listItem && listItem.dataset.titulo) {
            
            // Retroalimentación visual al invitado antes de borrar
            listItem.style.background = 'rgba(217, 70, 239, 0.3)'; 
            listItem.innerHTML = '<div style="text-align:center; width:100%; color:var(--color-primary); font-weight:bold;">¡Enviando a cabina... 🚀!</div>';

            const song = {
                titulo: listItem.dataset.titulo,
                artista: listItem.dataset.artista,
                genre: listItem.dataset.genre
            };
            
            // Pausa de 400ms para que se de cuenta que su click hizo algo
            setTimeout(() => {
                selectSong(song);
            }, 400);
        }
    });

    /**
     * Motor EMIT de Socket.IO hacia el DJ.
     */
    function selectSong(song) {
        socket.emit('nueva-cancion', { 
            salaId: salaId, 
            titulo: song.titulo, 
            artista: song.artista,
            genre: song.genre 
        });
        
        // Limpiamos los rastros y damos por concluida la transacción interactiva
        searchInput.value = '';
        suggestionsList.innerHTML = '';
        
        // Modal sorpresa de Rating (Premium UI)
        ratingModal.style.display = 'flex';
    }

    // 6. FLUJO DE VOTACIONES EN EL MODAL FLOTANTE
    let ratingDone = false;
    
    stars.forEach(star => {
        star.addEventListener('click', function() {
            if(ratingDone) return;
            ratingDone = true;
            
            const rating = this.getAttribute('data-value');
            
            // Coloreo visual de las estrellas clickadas (Animación)
            stars.forEach(s => {
                if(s.getAttribute('data-value') <= rating) {
                    s.style.color = '#ffaa00';
                    s.style.textShadow = '0 0 10px rgba(255, 170, 0, 0.8)';
                }
            });

            // Enviar voto silenciosamente por la red
            socket.emit('submit-rating', { partyId: salaId, rating: Number(rating) });
            
            // Tras de 600ms de animación cerramos la caja y la reseteamos
            setTimeout(() => {
                ratingModal.style.display = 'none';
                ratingDone = false;
                stars.forEach(s => { s.style.color = '#555'; s.style.textShadow = 'none'; });
            }, 600);
        });
    });

    // Ignorar votación cerrando brutalmente
    document.getElementById('close-modal').addEventListener('click', () => {
        ratingModal.style.display = 'none';
    });
});