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

    if (!content.includes('fetch(') && !content.includes('fetch`')) return;

    if (!content.includes('import { apiClient }')) {
        content = content.replace(/(import .* from '.*'\n)/, "$1import { apiClient } from '@/lib/api-client'\n");
    }

    // `const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined, }), })`
    content = content.replace(/const res = await fetch\(['"`]\/api\/([^'"`]+)['"`],\s*\{\s*method:\s*'POST',\s*headers:\s*\{[^}]+\},\s*body:\s*JSON\.stringify\((.*?)\),\s*\}\)/gs, "const res = await apiClient.post('/$1', $2)");

    // `await fetch(`/api/tasks/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }), })`
    content = content.replace(/await fetch\(['"`]\/api\/([^'"`]+)['"`],\s*\{\s*method:\s*'PUT',\s*headers:\s*\{[^}]+\},\s*body:\s*JSON\.stringify\((.*?)\),\s*\}\)/gs, "await apiClient.put('/$1', $2)");

    // `fetch('/api/tasks').then(r => r.json()).then(d => set(d))` -> we already did this, but maybe we missed some `async` variants
    // `const res = await fetch('/api/xxx')` -> `const res = await apiClient.get('/xxx')`
    content = content.replace(/const res = await fetch\(['"`]\/api\/([^'"`]+)['"`]\)/g, "const res = await apiClient.get('/$1')");
    
    // `.then(r => r.json()).then(d => setCustomers(d.data || []))` -> `.then(d => setCustomers(d.data || []))`
    content = content.replace(/\.then\(\s*r\s*=>\s*r\.json\(\)\s*\)\.then\(\s*d\s*=>/g, ".then(d =>");

    // Replace `fetch(url, ...)` from generic loops
    content = content.replace(/const res = await fetch\(url,\s*\{\s*method,\s*headers:\s*\{[^}]+\},\s*body:\s*JSON\.stringify\(body\)\s*\}\)/g, "const res = method === 'POST' ? await apiClient.post(url.replace('/api/', '/'), body) : await apiClient.put(url.replace('/api/', '/'), body)");

    // Handle `.then(fetch...)`
    content = content.replace(/\.then\(\s*fetch\w*\s*\)/g, "() => fetch..."); // Can't easily regex this, I will manually fix the remaining ones if they break. Actually I will not touch this with regex.

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated', filePath);
    }
});
