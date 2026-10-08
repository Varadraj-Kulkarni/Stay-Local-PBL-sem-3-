import fs from 'fs';
import path from 'path';

function removeAiLooks(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.tools' && file !== 'dist') {
                removeAiLooks(fullPath);
            }
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf-8');
            
            let originalContent = content;
            
            // Remove backdrop-blur, heavy rounded borders, soft/lift custom shadows, glass looks
            content = content.replace(/backdrop-blur-[a-z0-9]+/g, '');
            content = content.replace(/bg-background\/[0-9]+/g, 'bg-background');
            content = content.replace(/shadow-lift/g, 'shadow-md');
            content = content.replace(/shadow-soft/g, 'shadow-sm');
            content = content.replace(/rounded-3xl/g, 'rounded-md');
            content = content.replace(/rounded-full/g, 'rounded-md'); // Simplify extremely rounded corners common in AI designs
            content = content.replace(/bg-white\/10/g, 'bg-muted');
            content = content.replace(/shadow-2xl/g, 'shadow-lg');
            
            if (content !== originalContent) {
                console.log('Cleaned AI aesthetics from', fullPath);
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

removeAiLooks(path.join(process.cwd(), 'src'));
console.log("AI aesthetic cleanup complete.");
