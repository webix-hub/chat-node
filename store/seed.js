const fs = require("fs-extra");
const db = require("./db");
const scheme = require("./scheme");

const config = require("../config");
const { json } = require("./db");

async function importDemoStruct(path, actor) {
  const text = await fs.readFile(__dirname + path);
  const objs = JSON.parse(text);

  await Promise.all(objs.map((obj) => actor.create(obj)));
}

async function init() {
  await importDemoStruct("/demodata/user.json", scheme.User);
  await importDemoStruct("/demodata/chat.json", scheme.Chat);
  await importDemoStruct("/demodata/message.json", scheme.Message);
  await importDemoStruct("/demodata/userchat.json", scheme.UserChat);
}

module.exports = { init };
