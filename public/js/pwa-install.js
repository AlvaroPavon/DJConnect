// === GESTIÓN DE PWA E INSTALACIÓN ===

let deferredPrompt;
let isInstalled = false;

// Registrar Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('✅ Service Worker registrado:', registration.scope);
            })
            .catch(error => {
                console.error('❌ Error al registrar Service Worker:', error);
            });
    });
}

// Detectar si la app ya está instalada
window.addEventListener('DOMContentLoaded', () => {
    // Verificar si se ejecuta en modo standalone (app instalada)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
        isInstalled = true;
        console.log('✅ App ejecutándose en modo instalado');
    }
});

// Capturar el evento de instalación
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('🎯 Evento de instalación capturado');
    // Prevenir el mini-infobar automático en móvil
    e.preventDefault();
    // Guardar el evento para usarlo después
    deferredPrompt = e;
    
    // Mostrar botón de instalación personalizado si existe
    const installButton = document.getElementById('install-app-btn');
    if (installButton && !isInstalled) {
        installButton.style.display = 'block';
    }
});

// Función para mostrar el prompt de instalación
async function showInstallPrompt() {
    if (!deferredPrompt) {
        alert('La aplicación ya está instalada o no está disponible para instalación en este navegador.');
        return;
    }

    // Mostrar el prompt de instalación
    deferredPrompt.prompt();
    
    // Esperar la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} la instalación`);
    
    if (outcome === 'accepted') {
        console.log('✅ PWA instalada exitosamente');
        isInstalled = true;
        
        // Ocultar botón de instalación
        const installButton = document.getElementById('install-app-btn');
        if (installButton) {
            installButton.style.display = 'none';
        }
    }
    
    // Limpiar el prompt
    deferredPrompt = null;
}

// Detectar cuando se instaló la app
window.addEventListener('appinstalled', () => {
    console.log('✅ DJConnect instalado correctamente');
    isInstalled = true;
    deferredPrompt = null;
    
    // Ocultar botón de instalación
    const installButton = document.getElementById('install-app-btn');
    if (installButton) {
        installButton.style.display = 'none';
    }
});

// Monitorear conexión a internet
window.addEventListener('online', () => {
    console.log('✅ Conexión a internet restaurada');
    // Opcional: mostrar notificación
});

window.addEventListener('offline', () => {
    console.warn('⚠️ Sin conexión a internet');
    // Opcional: mostrar notificación
});

// Exportar funciones para uso global
window.PWA = {
    showInstallPrompt,
    isInstalled: () => isInstalled,
    hasPrompt: () => !!deferredPrompt
};
