import fs from 'fs';
import path from 'path';

function removeEmojis(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.tools' && file !== 'dist') {
                removeEmojis(fullPath);
            }
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf-8');
            // Regex to match emojis
            const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{1F004}-\u{1F0CF}\u{2B50}\u{2B55}\u{231A}\u{231B}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}]/gu;
            
            if (emojiRegex.test(content)) {
                console.log('Removing emojis from', fullPath);
                content = content.replace(emojiRegex, '');
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

removeEmojis(path.join(process.cwd(), 'src'));
removeEmojis(path.join(process.cwd(), 'server'));
console.log("Emoji stripping complete.");
