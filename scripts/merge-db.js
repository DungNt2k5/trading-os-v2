const Database = require('better-sqlite3');
const path = require('path');

const src = 'E:\\Users\\nguye.HELIOS300\\AppData\\Local\\trading-os\\_up_\\prisma\\data.db';
const dst = path.join(__dirname, '..', 'dev.db');

const source = new Database(src, { readonly: true });
const dest = new Database(dst);

const tables = source.prepare(`
  SELECT name FROM sqlite_master
  WHERE type='table'
  AND name NOT LIKE 'sqlite_%'
  AND name NOT LIKE '_prisma_%'
`).all();

for (const { name } of tables) {
  const rows = source.prepare(`SELECT * FROM "${name}"`).all();
  if (rows.length === 0) {
    console.log(`⏭️ ${name}: empty`);
    continue;
  }

  const cols = Object.keys(rows[0]).map(c => `"${c}"`).join(', ');
  const placeholders = Object.keys(rows[0]).map(c => `@${c}`).join(', ');

  const insert = dest.prepare(`INSERT OR REPLACE INTO "${name}" (${cols}) VALUES (${placeholders})`);

  const insertMany = dest.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });

  insertMany(rows);
  console.log(`✅ ${name}: ${rows.length} rows`);
}

console.log('✅ Done!');
source.close();
dest.close();