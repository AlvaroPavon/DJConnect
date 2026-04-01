// Configuración centralizada del servidor
// Este archivo detecta automáticamente la URL del backend según el entorno
(function() {
    // En producción, el backend estará en el mismo dominio con prefijo /api
    // En desarrollo local, usar localhost con el puerto correcto
    // Permitimos IPs de red local (LAN) tipo 192.168.x.x, 10.x.x.x, o localhost
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.startsWith('192.168.') ||
                        window.location.hostname.startsWith('10.');
    
    if (isLocalhost) {
        // En desarrollo/red local, usar el puerto 3000 si no exite puerto definido
        window.SERVER_URL = `http://${window.location.hostname}:${window.location.port || 3000}`;
    } else {
        // En producción remota, usar el mismo origen
        window.SERVER_URL = window.location.origin;
    }
})();
