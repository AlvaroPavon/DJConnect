/**
 * =========================================================================
 * AJUSTES GENERALES DEL SISTEMA ADMINISTRATIVO (admin-settings.js)
 * Función: Extrae las KPIs finales y perfiles corporativos para poder
 * customizar la app Web/PWA con el logotipo del contratante.
 * =========================================================================
 */

const token = localStorage.getItem('dj-token');
const serverUrl = window.SERVER_URL || window.location.origin;

// Bloqueo de intrusos
if (!token) {
    window.location.href = '/html/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    verifyAdmin();         
    loadCurrentLogo();     // Extraer imagen Base64 o URL del Backend config
    loadStats();           // Rellenar Diagnostics
    setupEventListeners();
});

/**
 * Filtro 1: Comprobador JWT 
 */
async function verifyAdmin() {
    try {
        const res = await fetch(`${serverUrl}/api/verify-admin`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            window.location.href = '/html/dj.html'; // No admin
        }
    } catch (err) {
        window.location.href = '/html/login.html';
    }
}

function setupEventListeners() {
    document.getElementById('upload-logo-form').addEventListener('submit', uploadLogo);
}

/**
 * Invoca el endpoint público de lectura general (Logo actual).
 */
async function loadCurrentLogo() {
    try {
        const response = await fetch(`${serverUrl}/api/config/logo`);
        if (response.ok) {
            const data = await response.json();
            if (data.logoUrl) {
                const logo = document.getElementById('preview-logo');
                const headerLogo = document.getElementById('company-logo');
                
                logo.src = data.logoUrl;
                logo.alt = 'Logo Actual Corporativo';
                
                if (headerLogo) {
                    headerLogo.src = data.logoUrl;
                    headerLogo.style.display = 'block';
                }
            }
        }
    } catch (error) {
        console.warn('Fallo silencioso detectando Logo Empresarial:', error);
    }
}

/**
 * Inyecta información general sobre los volúmenes de trabajo de DJs en tu red
 */
async function loadStats() {
    try {
        const response = await fetch(`${serverUrl}/api/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const stats = await response.json();
            document.getElementById('total-djs').textContent = stats.totalDJs;
            document.getElementById('active-parties').textContent = stats.activeParties;
            document.getElementById('active-wishlists').textContent = stats.totalWishlists;
        }
    } catch (error) {
        console.error('Error inyectando métricas:', error);
    }
}

/**
 * Función cruda de procesado de Imágenes Locales
 * Captura, valida tamaño/formato, comprime a Base64 y sube a Mongo vía Endpoint Seguro Post.
 */
async function uploadLogo(e) {
    e.preventDefault();
    
    // Extracción de file pointer del DOM HTML nativo
    const fileInput = document.getElementById('logo-file');
    const file = fileInput.files[0];
    
    // Validaciones Rápidas (Short Circuit)
    if (!file) {
        alert('❌ Incrusta primer un archivo (JPG/PNG).');
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        alert('❌ Operación prohibida: El protocolo exige un documento fotográfico real.');
        return;
    }
    
    if (file.size > 2 * 1024 * 1024) {  // Hard limit: 2MBs
        alert('❌ Error de Carga Búfer: La imagen seleccionada sobrepasa el límite max (2MB). Redúzcala.');
        return;
    }
    
    try {
        const reader = new FileReader();
        
        // Bloque Asíncrono: Dispara cuando termina de leer los Bytes locales a texto Base64
        reader.onload = async function(event) {
            const base64Image = event.target.result;
            
            // Envío del Payload
            const response = await fetch(`${serverUrl}/api/admin/config/logo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                // El backend "uploadLimiter" lo parseará a la Collection config de MongoDB
                body: JSON.stringify({ logoData: base64Image })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.message || 'Denegado por servidor.';
                throw new Error(`Rotura post-subida: ${errorMsg}`);
            }
            
            alert('✅ Identidad Gráfica asimilada por los servidores de DJConnect.');
            loadCurrentLogo(); // Repintado de interfaz (DOM)
            fileInput.value = ''; // Limpiar campo del formulario
        };
        
        reader.readAsDataURL(file); // Activa el proceso lector FileReader
        
    } catch (error) {
        console.error('Subida abortada en medio de proceso HTTP:', error);
        alert('❌ Falla Crítica Servidor: No pudo procesarse y encodear la imagen.');
    }
}
