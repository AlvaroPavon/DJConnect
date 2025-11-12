const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
    { size: 192, name: 'icon-192x192.png' },
    { size: 512, name: 'icon-512x512.png' }
];

const inputImage = path.join(__dirname, 'public', 'images', 'logo.png');
const outputDir = path.join(__dirname, 'public', 'images');

async function generateIcons() {
    console.log('🎨 Generando iconos para PWA...');
    
    try {
        for (const { size, name } of sizes) {
            const outputPath = path.join(outputDir, name);
            
            await sharp(inputImage)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 26, g: 26, b: 26, alpha: 1 }
                })
                .toFile(outputPath);
            
            console.log(`✅ Icono generado: ${name} (${size}x${size})`);
        }
        
        console.log('🎉 Todos los iconos generados exitosamente');
    } catch (error) {
        console.error('❌ Error generando iconos:', error);
        process.exit(1);
    }
}

generateIcons();
