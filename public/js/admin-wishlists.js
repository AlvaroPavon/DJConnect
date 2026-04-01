/**
 * =========================================================================
 * GESTOR DE REPERTORIOS Y LISTAS (admin-wishlists.js)
 * Función: Despliega las 'Wishlists' creadas de bases de datos de música o
 * listas predefinidas para eventos (Bodas, Fiestas X, etc.). 
 * Incluye generación PDF de las peticiones para enviarlas por correo o 
 * llevarlas impresas.
 * =========================================================================
 */

const token = localStorage.getItem('dj-token');
const serverUrl = window.SERVER_URL || window.location.origin;

// Bloqueo estricto del Panel de control admin
if (!token) {
    window.location.href = '/html/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    verifyAdmin();         // Prevenir escalada de privilegios
    loadDJs();             // Asigna al Select formográfico
    loadWishlists();       // Carga la información central MongoDB
    loadCompanyLogo();
    setupEventListeners();
});

/**
 * Filtro 1: Autenticación de servidor JWT y validación del 'role' == 'admin'
 */
async function verifyAdmin() {
    try {
        const res = await fetch(`${serverUrl}/api/verify-admin`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            window.location.href = '/html/dj.html';
        }
    } catch (err) {
        window.location.href = '/html/login.html';
    }
}

function setupEventListeners() {
    // Al atrapar el evento Submit evitamos el recargo (F5) para una SPA Fluída
    document.getElementById('create-wishlist-form').addEventListener('submit', createWishlist);
}

/**
 * Rellena el listado de opciones con el personal de música
 */
async function loadDJs() {
    try {
        const response = await fetch(`${serverUrl}/api/admin/djs`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Se perdió el enlace HTTP');
        
        const djs = await response.json();
        const select = document.getElementById('dj-select');
        
        djs.filter(dj => dj.role === 'dj' || !dj.role).forEach(dj => {
            const option = document.createElement('option');
            option.value = dj.username;
            
            const totalFiestas = dj.partyCount || 0;
            option.textContent = `🎧 @${dj.username} (Fiestas operadas: ${totalFiestas})`;
            
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Problema en Render DJs:', error);
    }
}

/**
 * Petición asincrónica a los catálogos MongoDB sobre listas pregrabadas
 */
async function loadWishlists() {
    const loadingMessage = document.getElementById('loading-message');
    const wishlistsList = document.getElementById('wishlists-list');
    
    try {
        const response = await fetch(`${serverUrl}/api/admin/wishlists`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Caída de API Wishlist');
        
        const wishlists = await response.json();
        loadingMessage.style.display = 'none'; // Quitar animaciones spinners si existen
        
        if (wishlists.length === 0) {
            wishlistsList.innerHTML = '<p class="glow-text">Bases vacías o aún no definidas.</p>';
            return;
        }
        
        // Repintado con efecto .cards-grid
        wishlistsList.innerHTML = '';
        wishlists.forEach(wishlist => {
            const card = createWishlistCard(wishlist);
            wishlistsList.appendChild(card);
        });
        
    } catch (error) {
        console.error('Data Load Error:', error);
        loadingMessage.textContent = '❌ Base inalcanzable temporalmente.';
    }
}

/**
 * Generador HTML (Card) que encaja en el CSS Glassmorphism .stats-card
 */
function createWishlistCard(wishlist) {
    const card = document.createElement('div');
    card.className = 'stats-card animate-fade-in';
    
    // Semaforización de la Card ("Activa" recibe nuevos submits, "Cerrada" se bloquea).
    const statusBadge = wishlist.isActive 
        ? '<span style="color: var(--color-accent); font-weight: bold;">🟢 RECIBIENDO SOLICITUDES</span>' 
        : '<span style="color: var(--color-text-secondary);">⚫ CERRADA (SOLO LECTURA)</span>';
    
    const eventDate = wishlist.eventDate 
        ? new Date(wishlist.eventDate).toLocaleDateString('es-ES') 
        : 'Sin agenda temporal';
    
    const btnAperturaHTML = wishlist.isActive 
        ? `<button onclick="toggleWishlist('${wishlist.wishlistId}')" class="btn btn-secondary">🔒 Prohibir Nv Petición</button>`
        : `<button onclick="toggleWishlist('${wishlist.wishlistId}')" class="btn" style="background-color:var(--color-secondary)">🔓 Abrir Módulo (Público)</button>`;
    
    card.innerHTML = `
        <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
            <div>
                <h3 style="color: var(--color-primary); font-size: 1.6em; margin: 0 0 5px 0;">${wishlist.name}</h3>
                <p style="font-size: 0.85em; opacity: 0.7; font-family: monospace; margin: 0 0 15px 0;">ID: ${wishlist.wishlistId}</p>
                
                <div style="background: rgba(0,0,0,0.5); border-radius: 8px; padding: 15px;">
                    <p style="margin: 5px 0;">🎙️ Asignada a: <strong style="float: right;">@${wishlist.djUsername}</strong></p>
                    <p style="margin: 5px 0;">📅 Fecha de uso: <strong style="float: right;">${eventDate}</strong></p>
                    <div style="text-align: center; margin-top: 20px; border-top: 1px dotted rgba(255,255,255,0.2); padding-top: 15px;">
                        <h2 style="color: var(--color-accent); margin: 0 0 5px 0;">${wishlist.songs.length}</h2>
                        <small>Peticiones Capturadas</small>
                    </div>
                </div>
            </div>
            
            <p style="text-align: center; margin: 20px 0 10px 0;">${statusBadge}</p>
            
            <!-- Botones responsivos grid del admin -->
            <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
                <button onclick="viewWishlistDetails('${wishlist.wishlistId}')" class="btn" style="background-color: var(--color-primary);">
                    👁️ Leer / Exportar (PDF)
                </button>
                ${btnAperturaHTML}
                <button onclick="deleteWishlist('${wishlist.wishlistId}', '${wishlist.name}')" class="btn btn-danger">
                    🗑️ Borrar Permanentemente
                </button>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Enviar petición POST a MongoDB creando las bases para una nueva noche/bodas
 */
async function createWishlist(e) {
    e.preventDefault();
    
    const name = document.getElementById('wishlist-name').value.trim();
    const description = document.getElementById('wishlist-description').value.trim();
    const eventDate = document.getElementById('wishlist-date').value;
    const djUsername = document.getElementById('dj-select').value;
    
    if (!name || !djUsername) {
        alert('A la lista le faltan datos críticos.');
        return;
    }
    
    try {
        const response = await fetch(`${serverUrl}/api/admin/wishlists`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, description, eventDate, djUsername })
        });
        
        const data = await response.json();
        if (!response.ok) {
            alert(`❌ Rechazo del Motor DB: ${data.message}`);
            return;
        }
        
        alert(`✅ Éxito absoluto. Catálogo "[${name}]" reservado. \nMándaselo por WhatsApp al DJ.`);
        document.getElementById('create-wishlist-form').reset();
        loadWishlists(); // Actualizar GUI Frontal
        
    } catch (error) {
        console.error('Rotura al generar listas:', error);
        alert('❌ Servidor no accesible.');
    }
}

/**
 * Interruptor Cierre Perimetral (Permite o prohíbe votos de extraños a la URL)
 */
async function toggleWishlist(wishlistId) {
    try {
        const response = await fetch(`${serverUrl}/api/wishlists/${wishlistId}/toggle`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Modificación interceptada');
        loadWishlists();
        
    } catch (error) {
        console.error('Fallo en la alteración de estado:', error);
        alert('❌ Ocurrió algo inesperado al cerrar/abrir.');
    }
}

/**
 * Solicitud Destructiva total.
 */
async function deleteWishlist(wishlistId, wishlistName) {
    if (!confirm(`Tensión: Quieres ELIMINAR toda la base asignada a ["${wishlistName}"].\nLas canciones elegidas desaparecerán.`)) return;
    try {
        const response = await fetch(`${serverUrl}/api/wishlists/${wishlistId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Database lockdown.');
        alert('✅ Destrucción efectuada.');
        loadWishlists();
    } catch (error) {
        alert('❌ Cuidado, hubo un error borrando la Wishlist');
    }
}

// ==========================================
// VENTANA MODAL, INSPECTOR Y GENERADOR PDF
// ==========================================

async function viewWishlistDetails(wishlistId) {
    try {
        const response = await fetch(`${serverUrl}/api/wishlists/${wishlistId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Archivo Corrupto o Oculto');
        
        const wishlist = await response.json();
        showWishlistModal(wishlist);
        
    } catch (error) {
        alert('❌ Error al interceptar el catálogo en caché.');
    }
}

/**
 * Lanza la UI que se sobrepone al Panel Administrativo usando ".modal" y ".modal-content"
 */
function showWishlistModal(wishlist) {
    // Si hubiera uno vivo lo destruimos
    closeWishlistModal(); 

    const modal = document.createElement('div');
    modal.id = 'wishlist-detail-modal';
    // Aprovechamos los estilos premium del css (efecto de cristal)
    modal.className = 'modal animate-fade-in';
    modal.style.display = 'flex';
    
    const eventDate = wishlist.eventDate 
        ? new Date(wishlist.eventDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'Incierta';
    
    // Rutas públicas que se mandarán vía WhatsApp enlazadas
    const wishlistUrl = `${window.location.origin}/html/wishlist.html?w=${wishlist.wishlistId}`;
    
    // Compilador de la tabla HTML para canciones elegidas
    const songsHtml = wishlist.songs.length > 0 
        ? wishlist.songs.map(song => `
            <div style="background: rgba(255, 255, 255, 0.05); border-left: 4px solid var(--color-accent); padding: 15px; margin: 10px 0; border-radius: 6px;">
                <strong style="color: #fff; font-size: 1.1em; display:block;">${song.titulo}</strong>
                <em style="color: var(--color-text-secondary); display:block; margin: 3px 0;">De: ${song.artista}</em>
                <div style="font-size: 0.85em; opacity: 0.7; margin-top: 10px; display: flex; justify-content: space-between;">
                    <span>📂 ${song.genre}</span>
                    <span>🕒 ${new Date(song.timestamp).toLocaleTimeString('es-ES')}</span>
                </div>
            </div>
        `).join('')
        : '<p class="glow-text">Las urnas aún están vacías.</p>';
    
    window.currentWishlistForPDF = wishlist;
    
    // Contenido general (Ventana)
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; width: 95%; max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px;">
                <h2 class="glow-text" style="color: var(--color-primary); margin: 0; font-size: 2em;">${wishlist.name}</h2>
                <button onclick="closeWishlistModal()" class="btn btn-danger" style="padding: 10px 15px; width: auto; font-size: 1.2em;">✕</button>
            </div>
            
            <div class="stats-card" style="margin-bottom: 20px; text-align: left;">
                <p><strong>🗓️ Asignación DJ:</strong> @${wishlist.djUsername}</p>
                <p><strong>📍 Fecha Marcada:</strong> ${eventDate}</p>
                ${wishlist.description ? `<p style="margin-top: 10px; border-left: 3px solid #ccc; padding-left: 10px;"><i>"${wishlist.description}"</i></p>` : ''}
                
                <h4 style="margin-top: 25px; margin-bottom: 10px; color: var(--color-secondary);">🔗 URL PÚBLICA PARA INVITADOS</h4>
                <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                    <input type="text" value="${wishlistUrl}" readonly style="flex: 1; padding: 12px; font-family: monospace; font-size: 0.85em; cursor: copy;" onclick="this.select()">
                    <button onclick="copyWishlistLink('${wishlistUrl}')" class="btn" style="width: auto; background-color: var(--color-secondary);">
                        📋 Copiar URL
                    </button>
                    <button onclick="exportWishlistToPDF()" class="btn" style="width: auto; background-color: var(--color-accent);">
                        📄 Descargar PDF
                    </button>
                </div>
            </div>
            
            <h3 style="margin-bottom: 15px;">🎵 Desglose de Tracklist Reservado</h3>
            <div style="max-height: 40vh; overflow-y: auto; padding-right: 15px; /* Fix scrollbar overflow */">
                ${songsHtml}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeWishlistModal() {
    const modal = document.getElementById('wishlist-detail-modal');
    if (modal) modal.remove();
}

function copyWishlistLink(url) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            alert('✅ Link listo para enviar (copiado al portapapeles)');
        });
    } else {
        prompt('Usa Control+C para apropiarte de la URL:', url); // Fallback navegadores de legado
    }
}

// Manejo del isologo comercial extraído como promesas
async function loadCompanyLogo() {
    try {
        const response = await fetch(`${serverUrl}/api/config/logo`);
        const data = await response.json();
        if (data.logoUrl) {
            const logo = document.getElementById('company-logo');
            logo.src = data.logoUrl;
            logo.style.display = 'block';
        }
    } catch(e) {}
}

/**
 * ----------------------------------------------------
 * LÓGICA DE DUMPING (CONVERTIR A PDF FÍSICO IMPRIMIBLE)
 * ----------------------------------------------------
 */
async function exportWishlistToPDF() {
    const wishlist = window.currentWishlistForPDF;
    if (!wishlist) {
        alert('❌ Conflicto: Se ha perdido la referencia local a la lista musical.');
        return;
    }

    try {
        // Carga On-Demand del motor generador de PDF (Para no ralentizar el inicio de la app)
        if (typeof window.jspdf === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            document.head.appendChild(script);
            
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
            });
        }

        const { jsPDF } = window.jspdf;
        const documento = new jsPDF();
        
        let yCursor = 20;

        // Estética Formal Base del PDF 
        documento.setFontSize(22);
        documento.setFont(undefined, 'bold');
        documento.text(`Setlist (Wishlist): ${wishlist.name}`, 20, yCursor);
        yCursor += 12;

        documento.setFontSize(12);
        documento.setFont(undefined, 'normal');
        documento.text(`Designado para Operador DJ: @${wishlist.djUsername}`, 20, yCursor);
        documento.text(`Impreso en Sistema DJConnect by Alvaro Pavon`, 20, yCursor + 8);
        yCursor += 20;

        documento.setFont(undefined, 'bold');
        documento.text(`Canciones Totales Registradas: ${wishlist.songs.length}`, 20, yCursor);
        yCursor += 10;
        documento.setFont(undefined, 'normal');

        // Renderizado del desglose Tracklist a Folios
        if (wishlist.songs.length === 0) {
           documento.text('Todavía no ha habido interacciones por el público', 20, yCursor);
        } else {
            wishlist.songs.forEach((song, ordinal) => {
                // Prevenir salida y derrame inferior creando una página "nueva"
                if (yCursor > 280) { 
                    documento.addPage();
                    yCursor = 20;
                }
                const renglon = `${ordinal + 1}. [${song.genre}] ${song.titulo} // Autor: ${song.artista}`;
                documento.text(renglon, 20, yCursor);
                yCursor += 8;
            });
        }

        // Proceso de entrega y descarga de disco
        const timeStamp = new Date().toISOString().split('T')[0];
        const archName = `Lista_Imprimible_${wishlist.name.replace(/[^a-zA-Z]/g, '_')}_${timeStamp}.pdf`;
        documento.save(archName);
        
    } catch (error) {
        console.error('El script ensamblador de hojas PDF interrumpió el proceso:', error);
        alert('❌ El archivo de memoria o librería PDF de Internet fallaron brutalmente.');
    }
}