const config = require("../config");
const { safeHTML, safeUrl } = require("./sanitize");

class MessagesAPI {
  constructor(dao, config) {
    this._dao = dao;
    this._config = config;
  }

  async GetAll(ctx, chatId) {
    const uid = ctx.value("user_id");
    const check = await this._dao.UsersCache.hasChat(uid, chatId);
    if (!check) throw "access denied";

    return this._dao.Message.getAll(chatId);
  }

  async ResetCounter(ctx, chatId) {
    const uid = ctx.value("user_id");
    const check = await this._dao.UsersCache.hasChat(uid, chatId);
    if (!check) throw "access denied";

    return this._dao.UserChat.resetCounter(chatId, uid);
  }

  async Add(ctx, text, chatId, origin) {
    const uid = ctx.value("user_id");
    const did = ctx.value("connection_id");
    const hub = ctx.value("hub");

    const check = await this._dao.UsersCache.hasChat(uid, chatId);
    if (!check) throw "access denied";

    const msg = {
      text: safeHTML(text),
      chat_id: chatId,
      user_id: uid,
      date: new Date(),
    };

    await this._dao.Message.save(msg);

    hub.publish("messages", {
      op: "add",
      msg,
      origin: origin,
      from: did,
    });

    await this._dao.UserChat.incrementCounter(chatId, uid);
    await this._dao.Chat.setLastMessage(chatId, msg);

    return msg;
  }

  async Update(ctx, msgID, text) {
    const uid = ctx.value("user_id");
    const did = ctx.value("connection_id");
    const hub = ctx.value("hub");

    const msg = await this._dao.Message.getOne(msgID);
    if (msg.user_id != uid) throw "access denied";

    const check = await this._dao.UsersCache.hasChat(uid, msg.chat_id);
    if (!check) throw "access denied";

    text = safeHTML(text);
    await this._dao.Message.save({ id: msgID, text });
    msg.text = text;

    hub.publish("messages", { op: "update", msg, from: did });

    const ch = await this._dao.Chat.getOne(msg.chat_id);
    if (ch.last_message == msg.id) {
      hub.publish("chats", {
        op: "message",
        chat_id: msg.chat_id,
        data: {
          message: msg.text,
          message_type: msg.type,
          date: msg.date,
        },
        user_id: 0,
      });
    }

    await this._dao.UserChat.incrementCounter(msg.chat_id, uid);
    return msg;
  }

  async Remove(ctx, msgID) {
    const uid = ctx.value("user_id");
    const did = ctx.value("connection_id");
    const hub = ctx.value("hub");

    const msg = await this._dao.Message.getOne(msgID);
    if (msg.user_id != uid) throw "access denied";

    const check = await this._dao.UsersCache.hasChat(uid, msg.chat_id);
    if (!check) throw "access denied";

    await this._dao.Message.delete(msgID);
    const ch = await this._dao.Chat.getOne(msg.chat_id);

    hub.publish("messages", {
      op: "remove",
      msg: {
        id: msgID,
        chat_id: msg.chat_id,
      },
      from: did,
    });
    if (ch.last_message == msg.id) {
      const msg = await this._dao.Chat.setLastMessage(msg.chat_id, null);
      hub.publish("chats", {
        op: "message",
        chat_id: msg.chat_id,
        data: {
          message: msg.text,
          message_type: 0,
          date: msg.date,
        },
        user_id: 0,
      });
    }
  }

  async AddReaction(ctx, msgID, reaction) {
    if (!this._config.reactions) throw "feature disabled";

    const uid = ctx.value("user_id");
    const did = ctx.value("connection_id");
    const hub = ctx.value("hub");

    const msg = await this._dao.Message.getOne(msgID);
    if (msg.user_id == uid) throw "you cannot add a reaction to your message";

    const check = await this._dao.UsersCache.hasChat(uid, msg.chat_id);
    if (!check) throw "access denied";

    const v = {
      message_id: msgID,
      reaction: reaction,
      user_id: uid,
    };

    await this._dao.Reaction.add(v);

    let arr = msg.reactions[reaction];
    if (arr) arr.push(uid);
    else msg.reactions[reaction] = [uid];

    hub.publish("messages", {
      op: "update",
      msg,
      from: did,
    });
    return msg;
  }

  async RemoveReaction(ctx, msgID, reaction) {
    if (!this._config.reactions) throw "feature disabled";

    const uid = ctx.value("user_id");
    const did = ctx.value("connection_id");
    const hub = ctx.value("hub");

    const msg = await this._dao.Message.getOne(msgID);
    if (msg.reactions && msg.user_id == uid)
      throw "you cannot add a reaction to your message";

    const check = await this._dao.UsersCache.hasChat(uid, msg.chat_id);
    if (!check) throw "access denied";

    const r = {
      message_id: msgID,
      reaction: reaction,
      user_id: uid,
    };

    await this._dao.Reaction.remove(r);

    const arr = msg.reactions[reaction];
    if (arr.length == 1) {
      delete msg.reactions[reaction];
    } else {
      msg.reactions[reaction] = arr.filter((a) => a != uid);
    }

    hub.publish("messages", {
      op: "update",
      msg,
      from: did,
    });

    return msg;
  }
}

module.exports = MessagesAPI;
