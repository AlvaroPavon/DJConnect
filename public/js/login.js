/**
 * =========================================================================
 * MANEJADOR DEL SISTEMA DE LOGIN (login.js)
 * Función: Controla la autenticación del usuario al servidor. Realiza una
 * solicitud POST y guarda el JWT (JSON Web Token) devuelto en el LocalStorage
 * del navegador. Luego, redirige al usuario al panel correspondiente según su rol.
 * =========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // Al cargar la página, verificamos si existe un logo configurado
    // por el administrador.
    loadCompanyLogo();
});

/**
 * Función asíncrona para obtener el logo global de la empresa.
 * Hace un fetch al endpoint público de config.
 */
async function loadCompanyLogo() {
    try {
        const serverUrl = window.SERVER_URL || window.location.origin;
        const response = await fetch(`${serverUrl}/api/config/logo`);
        
        // Si la petición fue un éxito
        if (response.ok) {
            const data = await response.json();
            // Si el backend dictamina que hay una URL de logo
            if (data.logoUrl) {
                const logo = document.getElementById('company-logo');
                if (logo) {
                    // Actualizamos la fuente de la imagen y la hacemos visible
                    logo.src = data.logoUrl;
                    logo.style.display = 'block';
                }
            }
        }
    } catch (error) {
        // Fallback silencioso: Si hay error de red, el logo quedará oculto
        console.error('Error cargando el logo del servidor:', error);
    }
}

/**
 * Escucha la sumisión del formulario de login
 */
document.getElementById('login-form').addEventListener('submit', async (e) => {
    // 1. Evitamos que la página recargue su vista por defecto
    e.preventDefault();
    
    // 2. Extraemos credenciales (con .value obtenemos la entrada de texto del front)
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const serverUrl = window.SERVER_URL || window.location.origin;

    // 3. Efectuamos el request contra nuestro Endpoint oficial
    const response = await fetch(`${serverUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    // 4. Analizamos la respuesta
    if (response.ok) {
        const data = await response.json();
        
        // Guardado de estado de sesión. El Token servirá para identificarnos
        // frente a rutas seguras del backend.
        localStorage.setItem('dj-token', data.token);
        
        // 5. Motor de Redirección según Roles
        // Evita que un DJ común (role: dj) pueda visitar páginas de administración ('admin')
        if (data.role === 'admin') {
            window.location.href = `/html/admin.html`;
        } else {
            window.location.href = `/html/dj.html`;
        }
    } else {
        // En caso de que el server responda status != 200/ok (claves inválidas, cuenta inexistente)
        const data = await response.json();
        alert(`Error: ${data.message}`);
    }
});