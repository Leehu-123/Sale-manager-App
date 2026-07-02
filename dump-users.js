const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('dev.db');

db.serialize(() => {
  db.all('SELECT * FROM User', (err, rows) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    fs.writeFileSync('sale_users_dump.json', JSON.stringify(rows, null, 2));
    console.log(`Dumped ${rows.length} users to sale_users_dump.json`);
    db.close();
  });
});
