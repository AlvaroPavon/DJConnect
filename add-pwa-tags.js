const fs = require('fs');
const path = require('path');

const pwaTags = `
    <!-- PWA Meta Tags -->
    <meta name="theme-color" content="#ff6b35">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="DJConnect">
    <link rel="manifest" href="/manifest.json">
    <link rel="apple-touch-icon" href="/images/icon-192x192.png">
    <link rel="icon" type="image/png" sizes="192x192" href="/images/icon-192x192.png">
    <link rel="icon" type="image/png" sizes="512x512" href="/images/icon-512x512.png">
    <!-- PWA Installation Script -->
    <script src="/js/pwa-install.js" defer></script>`;

const htmlFiles = [
    'public/index.html',
    'public/html/admin-djs.html',
    'public/html/admin-parties.html',
    'public/html/admin-settings.html',
    'public/html/admin-wishlists.html',
    'public/html/admin.html',
    'public/html/dj.html',
    'public/html/forgot-password.html',
    'public/html/history.html',
    'public/html/login.html',
    'public/html/ranking.html',
    'public/html/register.html',
    'public/html/reset-password.html',
    'public/html/wishlist-manager.html',
    'public/html/wishlist.html'
];

function addPWATags() {
    console.log('🚀 Agregando meta tags PWA a archivos HTML...\n');
    
    let successCount = 0;
    let skipCount = 0;
    
    htmlFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  No existe: ${file}`);
            return;
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Verificar si ya tiene los tags PWA
        if (content.includes('PWA Meta Tags') || content.includes('manifest.json')) {
            console.log(`⏭️  Ya tiene PWA tags: ${file}`);
            skipCount++;
            return;
        }
        
        // Buscar el cierre de </head> y agregar antes
        if (content.includes('</head>')) {
            content = content.replace('</head>', `${pwaTags}\n</head>`);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Actualizado: ${file}`);
            successCount++;
        } else {
            console.log(`❌ No se encontró </head> en: ${file}`);
        }
    });
    
    console.log(`\n🎉 Proceso completado:`);
    console.log(`   ✅ Archivos actualizados: ${successCount}`);
    console.log(`   ⏭️  Archivos omitidos: ${skipCount}`);
}

addPWATags();
