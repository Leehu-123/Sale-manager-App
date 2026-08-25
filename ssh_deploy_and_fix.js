const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

const scriptContent = fs.readFileSync('fix_permissions.js', 'utf8');

const commands = [
  "echo '=== Pull & Rebuild Core API ==='",
  "cd /var/www/Core-API && git fetch origin && git reset --hard origin/main",
  "cd /var/www/Core-API && docker compose -f docker-compose.prod.yml build core_api && docker compose -f docker-compose.prod.yml up -d core_api",
  "sleep 5",
  "echo '=== Running permissions script ==='",
  "cat << 'EOF' > /tmp/fix_permissions.js\n" + scriptContent + "\nEOF",
  "docker cp /tmp/fix_permissions.js core_api_app:/app/fix_permissions.js",
  "docker exec core_api_app node fix_permissions.js",
  "echo '=== Core API logs ==='",
  "docker logs core_api_app --tail 10"
].join(" ; ");

conn.on('ready', () => {
  console.log('Connected. Starting deploy and fix permissions...');
  conn.exec(commands, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', (code) => {
      console.log('\nFinished with code: ' + code);
      conn.end();
    });
    stream.on('data', (d) => { process.stdout.write(d.toString()); });
    stream.stderr.on('data', (d) => { process.stderr.write(d.toString()); });
  });
}).on('error', (err) => {
  console.error('SSH Error:', err);
}).connect({ host: '103.176.178.81', port: 22, username: 'root', password: 'Y6zqYBaga5UD5HWe', readyTimeout: 120000 });
