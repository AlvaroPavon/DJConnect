// Configuración centralizada del servidor
// Este archivo detecta automáticamente la URL del backend según el entorno
(function() {
    // En producción, el backend estará en el mismo dominio con prefijo /api
    // En desarrollo local, usar localhost con el puerto correcto
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
        // En desarrollo, usar el puerto del backend (8001)
        window.SERVER_URL = `http://localhost:${window.location.port || 8001}`;
    } else {
        // En producción, usar el mismo origen (el backend está en el mismo dominio)
        window.SERVER_URL = window.location.origin;
    }
})();
