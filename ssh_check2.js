const { Client } = require('ssh2');
const conn = new Client();

const commands = [
  "cat /var/www/Sale-manager-App/docker-compose.prod.yml",
].join(" ; ");

conn.on('ready', () => {
  conn.exec(commands, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    let output = '';
    stream.on('close', () => {
      require('fs').writeFileSync('vps_sale_compose.txt', output, 'utf8');
      console.log('Done');
      conn.end();
    });
    stream.on('data', (d) => { output += d.toString(); });
    stream.stderr.on('data', (d) => { output += d.toString(); });
  });
}).connect({ host: '103.176.178.81', port: 22, username: 'root', password: 'Y6zqYBaga5UD5HWe', readyTimeout: 60000 });
