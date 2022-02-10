const Sequelize = require("sequelize");
var colors = require("sequelize-log-syntax-colors").default;

const config = require("../config");

const db = new Sequelize(
  config.db.database,
  config.db.user,
  config.db.password,
  {
    dialect: "sqlite",
    storage: config.db.path,
    logging: function (text) {
      console.log(colors(text));
    },
  }
);

module.exports = db;
