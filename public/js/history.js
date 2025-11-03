const token = localStorage.getItem('dj-token');
if (!token) {
    window.location.href = '/html/login.html';
}

const serverUrl = window.SERVER_URL || window.location.origin;

async function loadHistory() {
    const loadingMessage = document.getElementById('loading-message');
    const partiesList = document.getElementById('parties-list');
    
    try {
        const response = await fetch(`${serverUrl}/api/party-history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar el historial');
        }
        
        const parties = await response.json();
        loadingMessage.style.display = 'none';
        
        if (parties.length === 0) {
            partiesList.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary);">No hay fiestas finalizadas aún.</p>';
            return;
        }
        
        parties.forEach(party => {
            const partyCard = document.createElement('div');
            partyCard.className = 'stats-panel';
            partyCard.style.marginBottom = '20px';
            
            const endDate = new Date(party.endDate);
            const formattedDate = endDate.toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const rating = party.averageRating > 0 
                ? `⭐ ${party.averageRating.toFixed(2)} / 5` 
                : 'Sin valoraciones';
            
            partyCard.innerHTML = `
                <h3 style="color: var(--color-secondary); margin-bottom: 10px;">🎉 ${party.partyId}</h3>
                <p><strong>Fecha de finalización:</strong> ${formattedDate}</p>
                <p><strong>Total de canciones pedidas:</strong> ${party.totalSongs}</p>
                <p><strong>Género más pedido:</strong> <span class="genre-badge top">${party.topGenre || 'Desconocido'}</span></p>
                <p><strong>Valoración media:</strong> ${rating}</p>
                <hr style="margin: 15px 0;">
                <details style="cursor: pointer;">
                    <summary style="color: var(--color-primary); font-weight: bold; padding: 5px 0;">Ver todas las canciones (${party.songRequests.length})</summary>
                    <ul id="songs-${party._id}" style="list-style: none; padding: 10px 0; max-height: 300px; overflow-y: auto;">
                        ${party.songRequests.map(song => `
                            <li style="padding: 8px; background-color: rgba(0,0,0,0.2); margin: 5px 0; border-radius: 5px; border-left: 3px solid ${song.played ? 'var(--color-secondary)' : 'var(--color-primary)'};">
                                <strong>${song.titulo}</strong><br>
                                <em style="font-size: 0.9em; color: var(--color-text-secondary);">${song.artista}</em>
                                ${song.genre ? `<span class="genre-tag">🎵 ${song.genre}</span>` : ''}
                                ${song.played ? '<span style="color: var(--color-secondary); margin-left: 10px;">✓ Puesta</span>' : ''}
                                ${song.hidden ? '<span style="color: var(--color-error); margin-left: 10px;">🚫 Oculta</span>' : ''}
                            </li>
                        `).join('')}
                    </ul>
                </details>
            `;
            
            partiesList.appendChild(partyCard);
        });
        
    } catch (error) {
        console.error('Error:', error);
        loadingMessage.textContent = 'Error al cargar el historial. Por favor, intenta de nuevo.';
        loadingMessage.style.color = 'var(--color-error)';
    }
}

loadHistory();
