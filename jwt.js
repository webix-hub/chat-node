const jwt = require("jsonwebtoken");
const config = require("./config");

async function createUserToken(id, device) {
  return jwt.sign({ id, device }, config.server.jwtsecret, {
    algorithm: "HS256",
  });
}

function verifyUserToken(token) {
  const tk = jwt.verify(token, config.server.jwtsecret, {
    algorithms: ["HS256"],
  });
  return tk;
}

module.exports = { createUserToken, verifyUserToken };
