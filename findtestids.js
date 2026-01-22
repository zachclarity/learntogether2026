const fs = require('fs');
const path = require('path');

const targetDir = process.argv[2] || '.';
const output = [];

// Folders we should definitely ignore to save time and avoid noise
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];
// Only scan text-based files
const VALID_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.html', '.vue', '.svelte'];

function searchFiles(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            // Skip ignored directories
            if (IGNORE_DIRS.includes(file)) continue;
            searchFiles(filePath);
        } else {
            const ext = path.extname(file).toLowerCase();
            if (!VALID_EXTENSIONS.includes(ext)) continue;

            try {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // This Regex is more aggressive:
                // It looks for 'data-testid', ignores spaces, handles =, 
                // and grabs content inside "", '', or ``
                const regex = /data-testid\s*=\s*{?\s*["'`]([^"'`]+)["'`]\s*}?/g;
                
                let match;
                while ((match = regex.exec(content)) !== null) {
                    output.push({
                        file: filePath,
                        testId: match[1],
                        line: content.substring(0, match.index).split('\n').length
                    });
                }
            } catch (err) {
                // Skip files that can't be read (permissions, etc.)
                continue;
            }
        }
    }
}

console.log(`Scanning: ${path.resolve(targetDir)}...`);
searchFiles(targetDir);

if (output.length > 0) {
    console.table(output);
    console.log(`\nFound ${output.length} occurrences.`);
} else {
    console.log("No data-testids found. Check your directory path or file extensions.");
}