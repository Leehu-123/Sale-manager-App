const { Client } = require('ssh2');
const conn = new Client();

const commands = [
  "echo '=== Pull & Rebuild Sale App (clean) ==='",
  "cd /var/www/Sale-manager-App && git fetch origin && git reset --hard origin/main && git log --oneline -5",
  "cd /var/www/Sale-manager-App && docker compose -f docker-compose.prod.yml build web_app && docker compose -f docker-compose.prod.yml up -d web_app",
  "docker restart nginx_proxy",
  "echo ''",
  "echo '=== Final Container Status ==='",
  "docker ps --format 'table {{.Names}}\\t{{.Status}}'",
  "echo ''",
  "echo '=== Verify Topbar has notification fetch ==='",
  "grep -n 'fetchNotifications\\|unreadCount' /var/www/Sale-manager-App/src/components/layout/Topbar.tsx | head -5",
].join(" ; ");

conn.on('ready', () => {
  console.log('Connected. Rebuilding Sale App...');
  conn.exec(commands, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', (code) => {
      console.log('\nDone with code: ' + code);
      conn.end();
    });
    stream.on('data', (d) => { process.stdout.write(d.toString()); });
    stream.stderr.on('data', (d) => { process.stderr.write(d.toString()); });
  });
}).on('error', (err) => {
  console.error('SSH Error:', err);
}).connect({ host: '103.176.178.81', port: 22, username: 'root', password: 'Y6zqYBaga5UD5HWe', readyTimeout: 120000 });
