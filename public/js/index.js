document.addEventListener('DOMContentLoaded', () => {
    const serverUrl = window.SERVER_URL || window.location.origin;
    const socket = io(serverUrl, { transports: ["websocket"] });
    const searchInput = document.getElementById('search-input');
    const suggestionsList = document.getElementById('suggestions');
    const ratingModal = document.getElementById('rating-modal');
    const urlParams = new URLSearchParams(window.location.search);
    const salaId = urlParams.get('dj');
    const stars = document.querySelectorAll('.stars span');

    if (!salaId) {
        window.location.href = '/html/login.html';
        return;
    }

    let searchTimeout;
    searchInput.addEventListener('keyup', () => {
        clearTimeout(searchTimeout);
        const query = searchInput.value;
        if (query.length < 3) {
            suggestionsList.innerHTML = ''; 
            return;
        }
        searchTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`${serverUrl}/api/search?q=${encodeURIComponent(query)}`);
                const songs = await response.json();
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
                console.error('Error buscando canciones:', error);
            }
        }, 300);
    });

    suggestionsList.addEventListener('click', (event) => {
        const listItem = event.target.closest('li');
        if (listItem) {
            const song = {
                titulo: listItem.dataset.titulo,
                artista: listItem.dataset.artista,
                genre: listItem.dataset.genre
            };
            selectSong(song);
        }
    });

    function selectSong(song) {
        socket.emit('nueva-cancion', { 
            salaId: salaId, 
            titulo: song.titulo, 
            artista: song.artista,
            genre: song.genre 
        });
        searchInput.value = '';
        suggestionsList.innerHTML = '';
        ratingModal.style.display = 'flex';
    }

    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = star.getAttribute('data-value');
            socket.emit('submit-rating', { partyId: salaId, rating: Number(rating) });
            alert(`¡Gracias por tu puntuación de ${rating} estrellas!`);
            ratingModal.style.display = 'none';
        });
    });

    document.getElementById('close-modal').addEventListener('click', () => {
        ratingModal.style.display = 'none';
    });
});