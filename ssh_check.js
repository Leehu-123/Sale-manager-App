const { Client } = require('ssh2');
const conn = new Client();

const commands = [
  "echo '=== Notifications controller routes ==='",
  "cat /var/www/Core-API/src/modules/notifications/notifications.controller.ts",
  "echo ''",
  "echo '=== Notifications module ==='",
  "cat /var/www/Core-API/src/modules/notifications/notifications.module.ts",
].join(" ; ");

conn.on('ready', () => {
  conn.exec(commands, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    let output = '';
    stream.on('close', () => {
      require('fs').writeFileSync('vps_notif_routes.txt', output, 'utf8');
      console.log('Done');
      conn.end();
    });
    stream.on('data', (d) => { output += d.toString(); });
    stream.stderr.on('data', (d) => { output += d.toString(); });
  });
}).connect({ host: '103.176.178.81', port: 22, username: 'root', password: 'Y6zqYBaga5UD5HWe', readyTimeout: 60000 });
