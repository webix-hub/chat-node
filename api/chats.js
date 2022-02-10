const { safeHTML, safeUrl } = require("./sanitize");

class ChatsAPI {
  constructor(dao) {
    this._dao = dao;
  }

  async AddDirect(ctx, targetUserId) {
    const uid = ctx.value("user_id");
    const did = ctx.value("connection_id");
    const hub = ctx.value("hub");

    const chatId = await this._dao.Chat.addDirect(targetUserId, uid);
    const info = await this._dao.UserChat.getOne(chatId, uid);

    // message sent for other user, so change DirectID accordingly
    const messageInfo = { ...info };
    messageInfo.direct_id = uid;
    hub.publish("chats", {
      op: "add",
      chat_id: chatId,
      data: messageInfo,
      from: did,
    });

    return info;
  }

  async AddGroup(ctx, name, avatar, users) {
    const uid = ctx.value("user_id");
    const did = ctx.value("connection_id");
    const hub = ctx.value("hub");

    // sanitize input
    name = safeHTML(name);
    avatar = safeUrl(avatar);

    const chatId = await this._dao.Chat.addGroup(name, avatar, [...users, uid]);
    const info = await this._dao.UserChat.getOne(chatId, uid);
    hub.publish("chats", {
      op: "add",
      chat_id: chatId,
      data: info,
      from: did,
    });

    return info;
  }

  async Update(ctx, chatId, name, avatar) {
    const uid = ctx.value("user_id");
    const did = ctx.value("connection_id");
    const hub = ctx.value("hub");

    const check = await this._dao.UsersCache.hasChat(uid, chatId);
    if (!check) throw "access denied";

    // sanitize input
    name = safeHTML(name);
    avatar = safeUrl(avatar);

    await this._dao.Chat.update(chatId, name, avatar);
    return this._getChatInfo(chatId, uid, did, hub, null);
  }

  async SetUsers(ctx, chatId, users) {
    const uid = ctx.value("user_id");
    const did = ctx.value("connection_id");
    const hub = ctx.value("hub");

    const check = await this._dao.UsersCache.hasChat(uid, chatId);
    if (!check) throw "access denied";

    const oldUsers = await this._dao.UsersCache.getUsers(chatId);
    chatId = await this._dao.Chat.setUsers(chatId, [...users, uid]);

    return this._getChatInfo(chatId, uid, did, hub, oldUsers);
  }

  async Leave(ctx, chatId) {
    const uid = ctx.value("user_id");
    const did = ctx.value("connection_id");
    const hub = ctx.value("hub");

    const check = await this._dao.UsersCache.hasChat(uid, chatId);
    if (!check) throw "access denied";

    const oldUsers = await this._dao.UsersCache.getUsers(chatId);
    await this._dao.Chat.leave(chatId, uid);

    const info = await this._dao.UserChat.getOneLeaved(chatId);

    return this._sendChatInfo(chatId, did, info, hub, oldUsers);
  }

  async _getChatInfo(chatId, userId, deviceId, events, targetUsers) {
    const info = await this._dao.UserChat.getOne(chatId, userId);
    this._sendChatInfo(chatId, deviceId, info, events, targetUsers);
    return info;
  }

  _sendChatInfo(chatId, did, info, events, targetUsers) {
    // prevent leaking of personal info
    const einfo = { ...info };
    einfo.direct_id = 0;
    einfo.unread_count = 0;
    einfo.status = 0;
    events.publish("chats", {
      op: "update",
      chat_id: chatId,
      data: einfo,
      from: did,
      to: targetUsers,
    });
  }
}

module.exports = ChatsAPI;
