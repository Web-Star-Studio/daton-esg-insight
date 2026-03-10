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

        // Replace only inside quoted className attributes
        const target = /\bflex justify-between items-center\b/g;
        content = content.replace(
            /className\s*=\s*(["'])([^"']*?)\1/gm,
            (match, quote, classes) =>
                target.test(classes)
                    ? `className=${quote}${classes.replace(target, "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4")}${quote}`
                    : match
        );

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            modifiedFiles++;
            console.log(`Updated Header: ${filePath}`);
        }
    }
});

console.log(`\nSuccessfully updated ${modifiedFiles} files via simple string replacement.`);
