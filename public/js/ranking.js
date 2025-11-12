const token = localStorage.getItem('dj-token');
if (!token) window.location.href = '/html/login.html';

const serverUrl = window.SERVER_URL || window.location.origin;

document.addEventListener('DOMContentLoaded', () => {
    loadRanking();
    loadCompanyLogo();
});

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

async function loadRanking() {
    const loadingMessage = document.getElementById('loading-message');
    const rankingContainer = document.getElementById('ranking-container');
    const rankingList = document.getElementById('ranking-list');
    const noDataMessage = document.getElementById('no-data-message');
    
    try {
        const response = await fetch(`${serverUrl}/api/ranking`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar ranking');
        }
        
        const rankingData = await response.json();
        
        loadingMessage.style.display = 'none';
        rankingContainer.style.display = 'block';
        
        if (rankingData.length === 0) {
            noDataMessage.style.display = 'block';
            return;
        }
        
        rankingList.innerHTML = '';
        rankingData.forEach((dj, index) => {
            const card = createRankingCard(dj, index + 1);
            rankingList.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error:', error);
        loadingMessage.innerHTML = '<p style="color: var(--color-error);">Error al cargar el ranking. Intenta recargar la página.</p>';
    }
}

function createRankingCard(dj, position) {
    const card = document.createElement('div');
    card.className = 'stats-panel';
    card.style.marginBottom = '15px';
    
    // Medallas para los 3 primeros
    let positionBadge = `<span style="font-size: 1.5em; font-weight: bold; color: var(--color-text-secondary);">#${position}</span>`;
    if (position === 1) {
        positionBadge = '<span style="font-size: 2em;">🥇</span>';
    } else if (position === 2) {
        positionBadge = '<span style="font-size: 2em;">🥈</span>';
    } else if (position === 3) {
        positionBadge = '<span style="font-size: 2em;">🥉</span>';
    }
    
    // Calcular estrellas según la valoración
    const rating = dj.averageRating !== 'Sin valoraciones' ? parseFloat(dj.averageRating) : 0;
    const stars = rating > 0 ? '⭐'.repeat(Math.round(rating)) : '☆☆☆☆☆';
    
    // Formatear la puntuación media
    const averageRatingText = dj.averageRating !== 'Sin valoraciones' 
        ? `${dj.averageRating} / 5.0` 
        : 'Sin valoraciones';
    
    card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px;">
            <div style="text-align: center; min-width: 60px;">
                ${positionBadge}
            </div>
            <div style="flex: 1;">
                <h3 style="margin: 0 0 12px 0; color: var(--color-secondary); font-size: 1.3em;">
                    ${dj.username}
                </h3>
                
                <!-- Puntuación Media -->
                <div style="background-color: rgba(187, 134, 252, 0.15); padding: 10px; border-radius: 6px; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                        <div>
                            <div style="font-size: 0.85em; color: var(--color-text-secondary); margin-bottom: 4px;">
                                ⭐ Puntuación Media
                            </div>
                            <div style="font-size: 1.4em; color: var(--color-primary); font-weight: bold;">
                                ${averageRatingText}
                            </div>
                        </div>
                        <div style="font-size: 1.5em;">
                            ${stars}
                        </div>
                    </div>
                </div>
                
                <!-- Estadísticas -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.95em;">
                    <div style="background-color: rgba(3, 218, 198, 0.15); padding: 8px; border-radius: 6px; text-align: center;">
                        <div style="color: var(--color-text-secondary); font-size: 0.85em; margin-bottom: 2px;">
                            📊 Valoraciones
                        </div>
                        <div style="color: var(--color-text-primary); font-weight: bold; font-size: 1.2em;">
                            ${dj.totalRatings}
                        </div>
                    </div>
                    <div style="background-color: rgba(207, 102, 121, 0.15); padding: 8px; border-radius: 6px; text-align: center;">
                        <div style="color: var(--color-text-secondary); font-size: 0.85em; margin-bottom: 2px;">
                            🎉 Fiestas
                        </div>
                        <div style="color: var(--color-text-primary); font-weight: bold; font-size: 1.2em;">
                            ${dj.partyCount}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

document.getElementById('back-link').addEventListener('click', (e) => {
    e.preventDefault();
    window.history.back();
});

window.addEventListener('capacitorDidLoad', () => {
    const Capacitor = window.Capacitor;
    const { App } = Capacitor.Plugins;

    if (Capacitor.isNativePlatform()) {
        App.addListener('backButton', ({ canGoBack }) => {
            if (canGoBack) {
                window.history.back();
            }
        });
    }
});