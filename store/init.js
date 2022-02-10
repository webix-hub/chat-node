const migration = require("./migrations");
const seed = require("./seed");
const scheme = require("./scheme");

async function init(config) {
  try {
    if (config.db.reset) await migration.drop();

    console.log("Migrating data");
    await migration.restore();

    if (config.db.seed) await seed.init();

    console.log("DB ready");
  } catch (e) {
    console.log("error during DB creation", e);
  }

  return scheme;
}

module.exports = init;
