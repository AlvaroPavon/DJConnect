/**
 * =========================================================================
 * MONITOR DE FIESTAS Y EVENTOS EN VIVO (admin-parties.js)
 * Función: Despliega las salas activas en tiempo real, interactuando con 
 * la base de datos central de MongoDB para cerrarlas forzosamente si
 * surgiera algún problema crítico o el DJ olvidase hacerlo.
 * =========================================================================
 */

const token = localStorage.getItem('dj-token');
const serverUrl = window.SERVER_URL || window.location.origin;

// Bloqueo estricto pre-renderizado
if (!token) {
    window.location.href = '/html/login.html';
}

// ==========================================
// INICIALIZACIÓN DE LA INTERFAZ
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    verifyAdmin();         // Prevenir engaños de tokens DJ estándar
    loadDJs();             // Cargar DJs disponibles en el selector (<select>)
    loadParties();         // Cargar eventos en la grilla visual
    loadCompanyLogo();
    setupEventListeners();
});

// Bug Fix BFCache: Refrescar listas al volver hacia atrás
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        loadParties();
    }
});
/**
 * Escudo de doble comprobación asíncrona contra el Backend.
 */
async function verifyAdmin() {
    try {
        const res = await fetch(`${serverUrl}/api/verify-admin`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            window.location.href = '/html/dj.html'; // Expulsado
        }
    } catch (err) {
        window.location.href = '/html/login.html';
    }
}

/**
 * Vinculación de escucha sobre el formulario de alta de nuevo evento
 */
function setupEventListeners() {
    document.getElementById('create-party-form').addEventListener('submit', createParty);
}

/**
 * Solicita todos los DJs para rellenar el menú desplegable (Select).
 * Comprueba cuántas fiestas tienen activas para bloquear (Disable) a 
 * quienes ya hayan superado el límite estructural (3).
 */
async function loadDJs() {
    try {
        const response = await fetch(`${serverUrl}/api/admin/djs`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Corte de conexión al cargar DJs base.');
        
        const djs = await response.json();
        const select = document.getElementById('dj-select');
        
        // Limpiamos contenido previo menos la opción por defecto
        select.innerHTML = '<option value="">Asigna un DJ de la plantilla...</option>';
        
        // Filtramos solo operadores llanos
        djs.filter(dj => dj.role === 'dj' || !dj.role).forEach(dj => {
            const option = document.createElement('option');
            option.value = dj.username;
            const activeParties = dj.activePartyIds ? dj.activePartyIds.length : 0;
            
            // Indicadores lógicos rápidos (Semáforo de saturación del trabajador)
            const statusEmoji = activeParties >= 3 ? '🔴' : activeParties >= 2 ? '🟡' : '🟢';
            
            option.textContent = `${statusEmoji} ${dj.username} (${activeParties}/3 fiestas vigentes)`;
            option.disabled = activeParties >= 3; // Bloqueo de API Nativo
            
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error inyectando menú de selección DJ:', error);
    }
}

/**
 * Recupera de MongoDB la matriz de salas o fiestas en "vivo" y 
 * manda construirlas en el DOM.
 */
async function loadParties() {
    const loadingMessage = document.getElementById('loading-message');
    const partiesList = document.getElementById('parties-list');
    
    try {
        const response = await fetch(`${serverUrl}/api/admin/parties`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Error al cargar la parrilla de fiestas');
        
        const parties = await response.json();
        loadingMessage.style.display = 'none';
        
        if (parties.length === 0) {
            partiesList.innerHTML = '<p class="glow-text">Las pistas están vacías. No hay fiestas activas.</p>';
            return;
        }
        
        partiesList.innerHTML = '';
        parties.forEach(party => {
            const card = createPartyCard(party);
            partiesList.appendChild(card);
        });
        
    } catch (error) {
        console.error('Rotura al descargar listas de fiesta:', error);
        loadingMessage.textContent = '❌ Error de comunicación con la DB.';
    }
}

/**
 * Lógica constructora de HTML nativo para "Tarjetas de Fiesta Activa".
 * Encaja en el sistema visual .cards-grid y .stats-card
 */
function createPartyCard(party) {
    const card = document.createElement('div');
    card.className = 'stats-card animate-fade-in';
    
    const createdDate = new Date(party.createdAt).toLocaleString('es-ES', { 
        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
    });
    
    // Contenedor estriado con grid asimétrico interno
    card.innerHTML = `
        <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
            <!-- Header -->
            <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 15px;">
                <h3 style="color: var(--color-secondary); margin: 0; font-size: 1.5em; word-break: break-all;">
                    📡 ${party.partyId}
                </h3>
            </div>
            
            <!-- Cuerpo Principal Info -->
            <div style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 8px;">
                <p style="margin: 5px 0;">
                    <span style="opacity: 0.7;">🎧 Operador a cargo:</span>
                    <strong style="color: var(--color-text-primary); float: right;">@${party.djUsername}</strong>
                </p>
                <p style="margin: 5px 0;">
                    <span style="opacity: 0.7;">⏱️ Abierta Módulo:</span>
                    <strong style="float: right; font-size: 0.9em; font-family: monospace;">${createdDate}</strong>
                </p>
                <div style="margin-top: 15px; text-align: center; border-top: 1px dashed rgba(255,255,255,0.2); padding-top: 10px;">
                    <span style="opacity: 0.7;">Peticiones Musicales (HitRate):</span>
                    <h2 style="margin: 5px 0; color: var(--color-primary);">${party.songRequests ? party.songRequests.length : 0}</h2>
                </div>
            </div>
            
            <!-- Footer Botonera Peligrosa -->
            <div style="margin-top: 20px;">
                <button onclick="endParty('${party.partyId}', '${party.djUsername}')" class="btn btn-danger" style="width: 100%;">
                    🚨 Abortar Evento
                </button>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * POST Request: Instancia en la Base de datos un nuevo documento Evento/Fiesta.
 */
async function createParty(e) {
    e.preventDefault();
    
    const partyName = document.getElementById('party-name').value.trim();
    const djUsername = document.getElementById('dj-select').value;
    
    if (!partyName || !djUsername) {
        alert('Debes darle un sufijo y elegir DJ.');
        return;
    }
    
    try {
        const response = await fetch(`${serverUrl}/api/admin/parties`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ partyName, djUsername })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            alert(`❌ API Rechaza Creación: ${data.message}`);
            return;
        }
        
        alert(`✅ Éxito en la Apertura. Sala "${data.partyId || partyName}" en vivo!`);
        document.getElementById('create-party-form').reset();
        
        // Recargas parciales para refrescar semáforos
        loadDJs(); 
        loadParties();
        
    } catch (error) {
        console.error('Interrupción de red:', error);
        alert('❌ Network Error: El sistema denegó la operación asíncrona.');
    }
}

/**
 * DELETE/POST Request Oculto: Clausura el documento de la fiesta para que el
 * público no pueda solicitar música nunca más (pasa a Histórico del DJ).
 */
async function endParty(partyId, djUsername) {
    if (!confirm(`Tensión: Vas a CLAUSURAR forzosamente la sala de [${djUsername}].\n\n¿Estás completamente seguro de esto?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${serverUrl}/api/admin/parties/${partyId}/end`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ djUsername })
        });
        
        if (!response.ok) throw new Error('Protección activa del servidor');
        
        alert('🔻 Emisión CORTADA y Archivada.');
        loadParties(); // Rafreshing DOM 
        loadDJs();     // Release the lock on the DJ picker
        
    } catch (error) {
        console.error('Rotura en clausura:', error);
        alert('❌ No fue posible terminar la sala de forma controlada.');
    }
}

// Sub-rutina logotipo estético
async function loadCompanyLogo() {
    try {
        const response = await fetch(`${serverUrl}/api/config/logo`);
        const data = await response.json();
        if (data.logoUrl) {
            const logo = document.getElementById('company-logo');
            logo.src = data.logoUrl;
            logo.style.display = 'block';
        }
    } catch (e) {
        // Nada
    }
}
