/**
 * =========================================================================
 * CORE DEL PANEL DE ADMINISTRACIÓN (admin.js)
 * Función: Punto de entrada crítico para verificar si el usuario tiene un
 * token JWT de 'admin' válido, y si es así, recolectar las estadísticas de 
 * uso (DJs, Fiestas, Wishlists) y pintarlas en la UI interactiva principal.
 * =========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. EXTRAER CREDENCIALES
    // Sacamos de la memoria de larga duración del móvil/PC el 'ticket de acceso'
    const token = localStorage.getItem('dj-token');
    const serverUrl = window.SERVER_URL || window.location.origin;

    // Si nadie se logueó, pateamos silenciosamente al publico al login
    if (!token) {
        window.location.href = '/html/login.html';
        return; // Salimos del flujo
    }

    // 2. VERIFICACIÓN CRÍTICA DE ROL CON EL BACKEND
    // Nos aseguramos que ese token no pertenezca a un simple DJ falsificando roles
    fetch(`${serverUrl}/api/verify-admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        if (!res.ok) {
            alert('❌ Escudo Activo: Área Restringida de Administración Global.');
            window.location.href = '/html/dj.html'; // Lo enviamos a su área que le corresponde
        } else {
            // == ARRANQUE DE DASHBOARD ==
            // Si el backend dictaminó que es Admin genuino, procedemos a pintar datos
            loadAdminData(serverUrl, token);
            loadCompanyLogo(serverUrl);
        }
    })
    .catch(err => {
        console.error('Pérdida de conectividad con Backend o Token malformado:', err);
        window.location.href = '/html/login.html';
    });
});

/**
 * Función que inyecta los KPIs (Métricas Clave de Rendimiento) en las famosas 'Cards' de Cristal.
 */
async function loadAdminData(serverUrl, token) {
    try {
        // Obtenemos el apodo del Admin
        const userRes = await fetch(`${serverUrl}/api/admin/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const userData = await userRes.json();
        
        // Lo ponemos de color Magenta Neón
        document.getElementById('admin-name').textContent = userData.username;

        // Inyectamos las matemáticas de la Base de Datos al usuario
        const statsRes = await fetch(`${serverUrl}/api/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const stats = await statsRes.json();
        
        // Conexión Document Object Model (DOM) -> Llenado numérico con animación base
        document.getElementById('total-djs').textContent = stats.totalDJs;
        document.getElementById('active-parties').textContent = stats.activeParties;
        document.getElementById('total-wishlists').textContent = stats.totalWishlists;
        
    } catch (error) {
        console.error('Fallo en el renderizado asíncrono de Stats:', error);
    }
}

/**
 * Carga el emblema/Isotipo comercial del Negocio en la zona superior de UI
 */
async function loadCompanyLogo(serverUrl) {
    try {
        const response = await fetch(`${serverUrl}/api/config/logo`);
        if (response.ok) {
            const data = await response.json();
            if (data.logoUrl) {
                const logo = document.getElementById('company-logo');
                logo.src = data.logoUrl;
                // Pequeña ráfaga visual (aparece súbito, muy pro en glassmorphism)
                logo.style.display = 'block';
                logo.style.borderRadius = '15px'; // Hacemos que la foto pegue con el diseño actual de bordes suaves
            }
        }
    } catch (error) {
        console.warn('Fallo silencioso: El cliente no subió un logo de marca propio.', error);
    }
}

/**
 * Procedimiento de Salida (Destructor de Tokens)
 */
function logout() {
    // Si queremos estar seguros de no dejar rastros en un PC público (por seguridad de admin)
    localStorage.removeItem('dj-token');
    window.location.href = '/html/login.html';
}
