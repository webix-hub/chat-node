const Call = require("./call");
const Chat = require("./chat");
const Message = require("./message");
const Reaction = require("./reaction");
const File = require("./file");
const User = require("./user");
const UserChat = require("./userchat");

const UsersCache = require("./cache");

function init(scheme, config) {
  const dao = {};

  dao.Call = new Call(dao, scheme);
  dao.Chat = new Chat(dao, scheme);
  dao.Message = new Message(dao, scheme, config);
  dao.Reaction = new Reaction(dao, scheme);
  dao.File = new File(dao, scheme);
  dao.User = new User(dao, scheme);
  dao.UserChat = new UserChat(dao, scheme);

  dao.UsersCache = new UsersCache(dao);

  return dao;
}

module.exports = init;
