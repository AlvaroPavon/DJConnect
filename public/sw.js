// === SERVICE WORKER DE DJCONNECT ===
// Este SW es MÍNIMO y solo permite la instalabilidad de la PWA
// NO cachea nada - la app REQUIERE conexión a internet para funcionar

const CACHE_NAME = 'djconnect-v1';

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Service Worker instalado');
    // Activar inmediatamente sin esperar
    self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Service Worker activado');
    // Tomar control inmediatamente
    event.waitUntil(clients.claim());
});

// Interceptar peticiones PERO NO CACHEAR NADA
// Todas las peticiones van directo a la red
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            // Si no hay conexión, mostrar mensaje
            if (event.request.mode === 'navigate') {
                return new Response(
                    `
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Sin Conexión - DJConnect</title>
                        <style>
                            * {
                                margin: 0;
                                padding: 0;
                                box-sizing: border-box;
                            }
                            body {
                                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                height: 100vh;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: white;
                                text-align: center;
                                padding: 20px;
                            }
                            .container {
                                background: rgba(255, 255, 255, 0.1);
                                backdrop-filter: blur(10px);
                                border-radius: 20px;
                                padding: 40px;
                                max-width: 500px;
                                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                            }
                            h1 {
                                font-size: 2.5rem;
                                margin-bottom: 20px;
                            }
                            .icon {
                                font-size: 4rem;
                                margin-bottom: 20px;
                            }
                            p {
                                font-size: 1.2rem;
                                line-height: 1.6;
                                margin-bottom: 30px;
                            }
                            .retry-btn {
                                background: #ff6b35;
                                color: white;
                                border: none;
                                padding: 15px 40px;
                                font-size: 1.1rem;
                                border-radius: 50px;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                font-weight: bold;
                            }
                            .retry-btn:hover {
                                background: #ff5722;
                                transform: scale(1.05);
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="icon">📡</div>
                            <h1>Sin Conexión</h1>
                            <p>DJConnect requiere conexión a internet para funcionar.</p>
                            <p>Por favor, verifica tu conexión y vuelve a intentarlo.</p>
                            <button class="retry-btn" onclick="window.location.reload()">
                                Reintentar
                            </button>
                        </div>
                    </body>
                    </html>
                    `,
                    {
                        headers: { 'Content-Type': 'text/html' }
                    }
                );
            }
            
            // Para otros tipos de peticiones, retornar error
            return new Response('Sin conexión a internet', {
                status: 503,
                statusText: 'Service Unavailable'
            });
        })
    );
});
