const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/app/(dashboard)');

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

walkSync(dir, function(filePath) {
    if (!filePath.endsWith('.tsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Skip if no fetch
    if (!content.includes('fetch(')) return;

    // Import apiClient if not exists
    if (!content.includes('import { apiClient }')) {
        content = content.replace(/(import .* from '.*'\n)/, "$1import { apiClient } from '@/lib/api-client'\n");
    }

    // Replace fetch('/api/xxx').then(r => r.json()).then(d => setUsers(d || []))
    content = content.replace(/fetch\(['"]\/api\/([^'"]+)['"]\)\.then\(r\s*=>\s*r\.json\(\)\)\.then\(([^)]+)\)/g, "apiClient.get('/$1').then($2)");

    content = content.replace(/fetch\(['"]\/api\/([^'"]+)['"]\)\.then\(r\s*=>\s*r\.json\(\)\)/g, "apiClient.get('/$1')");

    content = content.replace(/fetch\(`\/api\/([^`]+)`\)\.then\(r\s*=>\s*r\.json\(\)\)/g, "apiClient.get(`/$1`)");

    // Replace simple await fetch GETs
    content = content.replace(/const res = await fetch\(['"`]\/api\/([^'"`]+)['"`]\)\s*\n\s*const data = await res\.json\(\)/g, "const data = await apiClient.get(`/$1`)");

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated', filePath);
    }
});
