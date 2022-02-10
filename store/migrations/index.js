const fs = require("fs-extra");
const db = require("../db");
const scheme = require("../scheme");

async function migrateFile(name) {
  console.log("db << " + name);
  const txt = await fs.readFile(name);
  await migrate(txt.toString("utf8"));
}

async function migrate(text) {
  const lines = text.split(";");
  for (var i = 0; i < lines.length; i++) {
    const sql = lines[i].trim();
    if (sql) {
      await db.query(sql);
    }
  }
}

async function restore() {
  let state = { version: 0 };
  try {
    state = await scheme.State.findByPk(1);
  } catch (e) {
    /*empty DB*/
  }

  const mgs = (await fs.readdir(__dirname))
    .filter((a) => a.indexOf(".sql") !== -1)
    .filter((a) => a.indexOf("down.sql") === -1)
    .sort()
    .map((a) => ({ file: a, id: parseInt(a, 10) }));

  for (var i = 0; i < mgs.length; i++) {
    if (mgs[i].id >= state.version) {
      await migrateFile(__dirname + "/" + mgs[i].file);
      await scheme.State.upsert({ id: 1, version: mgs[i].id + 1 });
    }
  }
}

async function drop() {
  await migrateFile(__dirname + "/down.sql");
}

module.exports = { migrate, restore, drop };
