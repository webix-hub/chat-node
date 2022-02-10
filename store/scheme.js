const sequelize = require("./db");
const s = require("sequelize");
const Model = s.Model;

class State extends Model {}
State.init(
  {
    version: {
      type: s.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    timestamps: false,
    tableName: "states",
  }
);

class Call extends Model {}
Call.init(
  {
    start: { type: s.DATE },
    status: { type: s.INTEGER },
    from: { type: s.INTEGER },
    to: { type: s.INTEGER },
    from_device: { type: s.INTEGER },
    to_device: { type: s.INTEGER },
    chat_id: { type: s.INTEGER },
  },
  {
    sequelize,
    timestamps: false,
    tableName: "calls",
  }
);

class Chat extends Model {}
Chat.init(
  {
    name: { type: s.STRING },
    last_message: { type: s.INTEGER },
    avatar: { type: s.STRING },
  },
  {
    sequelize,
    timestamps: false,
    tableName: "chats",
  }
);

class File extends Model {}
File.init(
  {
    name: { type: s.STRING },
    path: { type: s.STRING },
    uid: { type: s.STRING },
    chat_id: { type: s.INTEGER },
  },
  {
    sequelize,
    timestamps: false,
    tableName: "files",
  }
);

class Message extends Model {}
Message.init(
  {
    text: { type: s.TEXT },
    date: { type: s.DATE },
    chat_id: { type: s.INTEGER },
    user_id: { type: s.INTEGER },
    type: { type: s.INTEGER },
    related: { type: s.INTEGER },
  },
  {
    sequelize,
    timestamps: false,
    tableName: "messages",
  }
);

class Reaction extends Model {}
Reaction.init(
  {
    message_id: { type: s.INTEGER },
    reaction: { type: s.STRING },
    user_id: { type: s.INTEGER },
  },
  {
    sequelize,
    timestamps: false,
    tableName: "reactions",
  }
);

class User extends Model {}
User.init(
  {
    name: { type: s.STRING },
    email: { type: s.STRING },
    avatar: { type: s.STRING },
    uid: { type: s.STRING },
    status: { type: s.INTEGER },
  },
  {
    sequelize,
    timestamps: false,
    tableName: "users",
  }
);

class UserChat extends Model {}
UserChat.init(
  {
    chat_id: { type: s.INTEGER },
    user_id: { type: s.INTEGER },
    unread_count: { type: s.INTEGER },
    direct_id: { type: s.INTEGER },
    status: { type: s.INTEGER },
  },
  {
    sequelize,
    timestamps: false,
    tableName: "user_chats",
  }
);

const Op = s.Op;
const DB = sequelize;
const Literal = sequelize.literal;

module.exports = {
  DB,
  Literal,
  User,
  UserChat,
  Reaction,
  File,
  Message,
  Chat,
  Call,
  Op,
  State,
};
