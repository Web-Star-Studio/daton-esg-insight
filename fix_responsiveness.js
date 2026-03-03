import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directoryPath = path.join(__dirname, 'src', 'pages');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ?
            walkDir(dirPath, callback) : callback(dirPath);
    });
}

let modifiedFiles = 0;

walkDir(directoryPath, function (filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // 1. Replace container mx-auto with w-full overflow-hidden
        content = content.replace(/className=(["'{`])([^"'{`]*?)container mx-auto([^"'{`]*?)(["'}])/g,
            'className=$1$2w-full overflow-hidden$3$4');

        // 2. Fix rigid flex headers that don't wrap on mobile
        content = content.replace(/className=(["'{`])([^"'{`]*?)([^-a-z])flex justify-between items-center([^"'{`]*?)(["'}])/g,
            'className=$1$2$3flex justify-between items-start sm:items-center gap-4 flex-col sm:flex-row$4$5');

        // 3. Fix button groups that might overflow
        content = content.replace(/className=(["'{`])([^"'{`]*?)flex gap-2([^"'{`]*?)(["'}])/g,
            'className=$1$2flex flex-wrap items-center gap-2 w-full sm:w-auto$3$4');

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            modifiedFiles++;
            console.log(`Updated: ${filePath}`);
        }
    }
});

console.log(`\nSuccessfully updated ${modifiedFiles} files.`);
