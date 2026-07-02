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

    // fetch(`/api/xxx`, {method: 'DELETE'})
    content = content.replace(/fetch\((['"`])\/api\/([^'"`]+)\1,\s*\{\s*method:\s*['"]DELETE['"]\s*\}\)/g, "apiClient.delete($1/$2$1)");

    // fetch(url, {method, headers, body})
    content = content.replace(/fetch\(url,\s*\{\s*method,\s*headers:\s*\{.*?\},\s*body:\s*JSON\.stringify\(body\)\s*\}\)/g, "(method === 'POST' ? apiClient.post(url, body) : apiClient.put(url, body))");
    
    // fetch(`/api/xxx/${id}`, { method: 'PUT', headers: ..., body: JSON.stringify({...}) })
    // We can't do this easily with regex. Let's do simple line by line replacements for known cases:

    // reports/page.tsx: fetch(`/api/reports?${params}`) -> apiClient.get(`/reports?${params}`)
    content = content.replace(/fetch\(`\/api\/reports\?\$\{params\}`\)/g, "apiClient.get(`/reports?${params}`)");

    // settings/page.tsx: fetch('/api/settings')
    content = content.replace(/fetch\('\/api\/settings'\)/g, "apiClient.get('/settings')");
    // settings/page.tsx: fetch('/api/settings', { ...
    content = content.replace(/const res = await fetch\('\/api\/settings',\s*\{\s*method:\s*'POST',\s*headers:\s*\{[^}]+\},\s*body:\s*JSON\.stringify\(form\),\s*\}\)/g, "await apiClient.post('/settings', form)");

    // tasks/page.tsx: fetch(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) })
    content = content.replace(/await fetch\(`\/api\/tasks\/\$\{id\}`,\s*\{\s*method:\s*'PUT',\s*headers:\s*\{[^}]+\},\s*body:\s*JSON\.stringify\(\{ status: newStatus \}\),\s*\}\)/g, "await apiClient.put(`/tasks/${id}`, { status: newStatus })");

    // tasks/page.tsx: fetch('/api/tasks', { method: 'POST', body: JSON.stringify({...form...}) })
    content = content.replace(/const res = await fetch\('\/api\/tasks',\s*\{\s*method:\s*'POST',\s*headers:\s*\{[^}]+\},\s*body:\s*JSON\.stringify\(\{\s*\.\.\.form,\s*dueDate: form\.dueDate \? new Date\(form\.dueDate\)\.toISOString\(\) : undefined,\s*\}\),\s*\}\)/g, "await apiClient.post('/tasks', { ...form, dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined })");

    // trips/create/page.tsx: fetch('/api/trips', { method: 'POST', body: JSON.stringify({ ...form, startDate..., endDate... }) })
    content = content.replace(/const res = await fetch\('\/api\/trips',\s*\{\s*method:\s*'POST',\s*headers:\s*\{[^}]+\},\s*body:\s*JSON\.stringify\(\{\s*\.\.\.form,\s*startDate: new Date\(form\.startDate\)\.toISOString\(\),\s*endDate: new Date\(form\.endDate\)\.toISOString\(\),\s*\}\),\s*\}\)/g, "const trip = await apiClient.post('/trips', { ...form, startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString() })");
    content = content.replace(/if \(res\.ok\) \{\s*const trip = await res\.json\(\)\s*router\.push\(`\/trips\/\$\{trip\.id\}`\)\s*\}/g, "router.push(`/trips/${trip.data.id}`)");

    // trips/[id]/page.tsx: fetch(`/api/trips/${params.id}`) -> apiClient.get(`/trips/${params.id}`)
    content = content.replace(/const res = await fetch\(`\/api\/trips\/\$\{params\.id\}`\)/g, "const res = await apiClient.get(`/trips/${params.id}`)");
    content = content.replace(/setTrip\(await res\.json\(\)\)/g, "setTrip(res.data)");
    
    content = content.replace(/await fetch\(`\/api\/trips\/\$\{params\.id\}`,\s*\{\s*method:\s*'PUT',\s*headers:\s*\{[^}]+\},\s*body:\s*JSON\.stringify\(\{ status: newStatus \}\),\s*\}\)/g, "await apiClient.put(`/trips/${params.id}`, { status: newStatus })");
    
    content = content.replace(/const res = await fetch\('\/api\/upload',\s*\{\s*method:\s*'POST',\s*body:\s*formData\s*\}\)/g, "const res = await apiClient.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })");
    content = content.replace(/const \{ url \} = await res\.json\(\)/g, "const url = res.data.url");
    
    content = content.replace(/const res = await fetch\(`\/api\/trips\/\$\{params\.id\}\/reports`,\s*\{\s*method:\s*'POST',\s*headers:\s*\{[^}]+\},\s*body:\s*JSON\.stringify\(\{\s*\.\.\.reportForm,\s*date: new Date\(reportForm\.date\)\.toISOString\(\),\s*imageUrl: reportForm\.imageUrl \|\| undefined,\s*\}\),\s*\}\)/g, "await apiClient.post(`/trips/${params.id}/reports`, { ...reportForm, date: new Date(reportForm.date).toISOString(), imageUrl: reportForm.imageUrl || undefined })");
    
    content = content.replace(/const res = await fetch\(`\/api\/trips\/\$\{params\.id\}`,\s*\{\s*method:\s*'PUT',\s*headers:\s*\{[^}]+\},\s*body:\s*JSON\.stringify\(\{ actualCost: parseFloat\(actualCost\) \|\| 0 \}\),\s*\}\)/g, "await apiClient.put(`/trips/${params.id}`, { actualCost: parseFloat(actualCost) || 0 })");

    // users/page.tsx
    content = content.replace(/const res = await fetch\('\/api\/teams',\s*\{\s*method:\s*'POST',\s*headers:\s*\{[^}]+\},\s*body:\s*JSON\.stringify\(teamForm\)\s*\}\)/g, "await apiClient.post('/teams', teamForm)");
    content = content.replace(/const res = await fetch\(`\/api\/teams\/\$\{id\}`,\s*\{\s*method:\s*'DELETE'\s*\}\)/g, "await apiClient.delete(`/teams/${id}`)");
    content = content.replace(/const res = await fetch\(`\/api\/users\/\$\{id\}`,\s*\{\s*method:\s*'DELETE'\s*\}\)/g, "await apiClient.delete(`/users/${id}`)");
    content = content.replace(/if \(res\.ok\) \{\s*setShowTeamModal\(false\);\s*setTeamForm\(\{ name: '', description: '' \}\);\s*fetchData\(\)\s*\}/g, "setShowTeamModal(false); setTeamForm({ name: '', description: '' }); fetchData()");
    content = content.replace(/if \(res\.ok\) fetchData\(\)/g, "fetchData()");

    // customers/[id]/page.tsx
    content = content.replace(/fetch\(`\/api\/customers\/\$\{params\.id\}`\)\.then\(r\s*=>\s*r\.json\(\)\)/g, "apiClient.get(`/customers/${params.id}`)");
    content = content.replace(/const res = await fetch\(`\/api\/customers\/\$\{params\.id\}\/interactions`,\s*\{\s*method:\s*'POST',\s*headers:\s*\{[^}]+\},\s*body:\s*JSON\.stringify\(form\),\s*\}\)/g, "await apiClient.post(`/customers/${params.id}/interactions`, form)");

    // orders/[id]/page.tsx
    content = content.replace(/const res = await fetch\(`\/api\/orders\/\$\{params\.id\}\/payments`,\s*\{\s*method:\s*'POST',\s*headers:\s*\{[^}]+\},\s*body:\s*JSON\.stringify\(\{ amount: parseFloat\(paymentForm\.amount\), method: paymentForm\.method, reference: paymentForm\.reference \}\),\s*\}\)/g, "await apiClient.post(`/orders/${params.id}/payments`, { amount: parseFloat(paymentForm.amount), method: paymentForm.method, reference: paymentForm.reference })");
    content = content.replace(/await fetch\(`\/api\/orders\/\$\{params\.id\}`,\s*\{\s*method:\s*'PUT',\s*headers:\s*\{[^}]+\},\s*body:\s*JSON\.stringify\(\{ status: newStatus \}\),\s*\}\)/g, "await apiClient.put(`/orders/${params.id}`, { status: newStatus })");

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated', filePath);
    }
});
