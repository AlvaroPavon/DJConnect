/**
 * =========================================================================
 * GESTOR DE RECURSOS HUMANOS (admin-djs.js)
 * Función: Lista a todos los DJs de la base de datos, permitiendo crear
 * nuevos perfiles, eliminar los existentes, o cambiar sus contraseñas en 
 * caso de pérdida a través de una API Rest autenticada.
 * =========================================================================
 */

const token = localStorage.getItem('dj-token');
const serverUrl = window.SERVER_URL || window.location.origin;

// Validar que hayamos iniciado sesión
if (!token) {
    window.location.href = '/html/login.html';
}

// Variable de estado global para controlar a qué DJ le estamos cambiando la clave
let currentDJId = null;

// ==========================================
// CICLO DE VIDA DE LA VISTA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    verifyAdmin();         // Prevenir suplantaciones de rango
    loadDJs();             // Traer la tabla de DJs de MongoDB
    loadCompanyLogo();     // Inyectar el logotipo empresarial
    setupEventListeners(); // Mapeo de botones de formularios
});

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        loadDJs();
    }
});
/**
 * Autenticación estricta: Corrobora con el servidor que el token pertenezca
 * a un administrador usando el endpoint protegido `/api/verify-admin`
 */
async function verifyAdmin() {
    try {
        const res = await fetch(`${serverUrl}/api/verify-admin`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            window.location.href = '/html/dj.html'; // Lo expulsamos a la vista normal
        }
    } catch (err) {
        window.location.href = '/html/login.html';
    }
}

/**
 * Enlaza los botones de tipo "submit" de los formularios con sus funciones lógicas.
 */
function setupEventListeners() {
    document.getElementById('create-dj-form').addEventListener('submit', createDJ);
    document.getElementById('change-password-form').addEventListener('submit', changePassword);
}

/**
 * Solicitud asíncrona para obtener el censo completo de usuarios.
 * Convierte el array JSON devuelto en llamativas Tarjetas de Interfaz Visual (Cards)
 */
async function loadDJs() {
    const loadingMessage = document.getElementById('loading-message');
    const djsList = document.getElementById('djs-list');
    
    try {
        const response = await fetch(`${serverUrl}/api/admin/djs`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Ataque o token vencido al cargar DJs');
        
        const djs = await response.json();
        
        // Quitar texto de carga animado
        loadingMessage.style.display = 'none';
        
        if (djs.length === 0) {
            djsList.innerHTML = '<p class="glow-text">No existen usuarios contratados aún.</p>';
            return;
        }
        
        // Limpiamos el dom de rastros previos
        djsList.innerHTML = '';
        
        // Iteramos los datos construyendo tarjetas
        djs.forEach(dj => {
            const card = createDJCard(dj);
            djsList.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error de red al volcar base de datos:', error);
        loadingMessage.textContent = '❌ Error de comunicación con base de datos.';
    }
}

/**
 * Motor inyector del DOM. Recibe el JSON parseado de un Usuario y devuelve 
 * un elemento Div nativo listo para ser renderizado en la grilla.
 * @param {Object} dj { _id, username, role, email, activePartyIds, partyCount }
 */
function createDJCard(dj) {
    const card = document.createElement('div');
    // Aplicamos estética de Cristal translúcido para el panel
    card.className = 'stats-card animate-fade-in';
    
    // Si es Dios del Panel, se denota, sino trabajador DJ
    const roleText = (dj.role === 'admin') ? '🛡️ Admin' : '🎧 DJ Base';
    const activeParties = dj.activePartyIds ? dj.activePartyIds.length : 0;
    
    // Interpolaciones limpias de String sin código HTML enroscado
    card.innerHTML = `
        <div style="display: flex; flex-direction: column; height: 100%; justify-content: space-between;">
            <div>
                <h3 style="color: var(--color-accent); font-size: 1.4em;">
                    ${dj.username} <span style="font-size: 0.7em; opacity: 0.7">(${roleText})</span>
                </h3>
                <p style="margin: 10px 0; font-family: monospace; color: var(--color-text-secondary)">
                    ✉️ ${dj.email || 'No proporcionado'}
                </p>
                <div style="background: rgba(0,0,0,0.5); padding: 10px; border-radius: 8px; margin-top: 15px;">
                    <p style="margin: 0; color: #fff;">🎉 Fiestas Hitóricas: <b>${dj.partyCount || 0}</b></p>
                    <p style="margin: 5px 0 0 0; color: #fff;">🔴 Salas En Directo: <b>${activeParties}/3</b></p>
                </div>
            </div>
            
            <!-- Botonera de control individual -->
            <div style="display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 20px;">
                <button onclick="openPasswordModal('${dj._id}', '${dj.username}')" class="btn btn-secondary">
                    🔑 Resetear Clave
                </button>
                ${dj.role !== 'admin' ? `
                <button onclick="deleteDJ('${dj._id}', '${dj.username}')" class="btn btn-danger">
                    🗑️ Despedir (Borrar)
                </button>
                ` : ''}
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Agrega a una nueva persona a la base de datos disparando el backend POST.
 */
async function createDJ(e) {
    e.preventDefault();
    
    const username = document.getElementById('dj-username').value.trim();
    const email = document.getElementById('dj-email').value.trim();
    const password = document.getElementById('dj-password').value;
    
    // Validaciones frontales rápidas
    if (!username || !email || !password) {
        alert('Por favor, rellena los campos críticos.');
        return;
    }
    
    try {
        const response = await fetch(`${serverUrl}/api/admin/djs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            alert(`❌ Error del Server: ${data.message}`);
            return;
        }
        
        alert(`✅ Alta Completa: ${username} tiene acceso a DJ Connect.`);
        
        // Limpiar el cajón visual y recargar la nube de tarjetas
        document.getElementById('create-dj-form').reset();
        loadDJs();
        
    } catch (error) {
        console.error('Error inyectando DJ nuevo:', error);
        alert('❌ Imposible conectar al generador de altas.');
    }
}

// ==========================================
// SEGURIDAD: VENTANA MODAL FLOTANTE
// ==========================================

function openPasswordModal(djId, djUsername) {
    currentDJId = djId;
    document.getElementById('password-dj-name').textContent = `Destino: @${djUsername}`;
    document.getElementById('password-modal').style.display = 'flex';
}

function closePasswordModal() {
    currentDJId = null;
    document.getElementById('password-modal').style.display = 'none';
    document.getElementById('change-password-form').reset();
}

/**
 * Ejecuta el blindaje PATCH contra la database mandando un nuevo string 
 * y dejando al AuthController hashearlo automáticamente.
 */
async function changePassword(e) {
    e.preventDefault();
    
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (newPassword !== confirmPassword) {
        alert('❌ Error dactilar: Las contraseñas digitadas no son gemelas.');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('❌ Para uso comercial, las claves deben ser de +6 caracteres.');
        return;
    }
    
    try {
        const response = await fetch(`${serverUrl}/api/admin/djs/${currentDJId}/password`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ password: newPassword })
        });
        
        if (!response.ok) throw new Error('Cifrado rechazado');
        
        alert('✅ Modificación Criptográfica Exitosa!');
        closePasswordModal(); // Desaparecer modal UI
        
    } catch (error) {
        console.error('Problemas con el parche de Password:', error);
        alert('❌ El backend rehusó cambiar la clave.');
    }
}

/**
 * Operación destructiva inminente: Aniquilar a un usuario para siempre
 */
async function deleteDJ(djId, djUsername) {
    // Protocolo de doble check humano
    if (!confirm(`Tensión: Estás a punto de ELIMINAR al trabajador "${djUsername}". \n\nNo podrá hacer más eventos y sus métricas quedarán huérfanas o borradas. ¿Continuar?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${serverUrl}/api/admin/djs/${djId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Base de datos protegida');
        
        alert('🏭 Despido/Eliminado Exitoso de los servidores.');
        
        // Renderizamos nuevo censo poblacional tras el borrado
        loadDJs();
        
    } catch (error) {
        console.error('Rotura al intentar DELETE request:', error);
        alert('❌ Cuidado, la base de datos se rehusó a borrar a este DJ.');
    }
}

// Auto-detector e inyector de logotipo
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
        console.warn('Isotipo visual no definido en el admin panel.');
    }
}
