const token = localStorage.getItem('dj-token');
if (!token) window.location.href = '/html/login.html'; // <-- RUTA CORREGIDA

const serverUrl = window.SERVER_URL || window.location.origin;

async function loadRanking() {
    const response = await fetch(`${serverUrl}/api/ranking`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
        const rankingData = await response.json();
        const tbody = document.getElementById('ranking-body');
        tbody.innerHTML = '';
        rankingData.forEach((dj, index) => {
            tbody.innerHTML += `
                <tr>
                    <td data-label="Posición">${index + 1}</td>
                    <td data-label="DJ">${dj.username}</td>
                    <td data-label="Puntuación Media">${dj.averageRating} ★</td>
                    <td data-label="Total Valoraciones">${dj.totalRatings}</td>
                    <td data-label="Fiestas Realizadas">${dj.partyCount}</td>
                </tr>`;
        });
    } else {
        alert('No se pudo cargar el ranking.');
    }
}
loadRanking();

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