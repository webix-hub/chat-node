class UsersCache {
  constructor(dao) {
    this._dao = dao;
    this._users = new Map();
    this._chats = new Map();
  }

  joinChat(userId, chatId) {
    let u = this._users.get(userId);
    if (!u) return;
    u.set(chatId, true);

    let c = this._chats.get(chatId);
    if (!c) return;
    c.set(userId, true);
  }

  leaveChat(userId, chatId) {
    const c = this._users.get(userId);
    if (!c) return;
    c.delete(chatId);

    const u = this._chats.get(chatId);
    if (!u) return;
    u.delete(userId);
  }

  async hasChat(userId, chatId) {
    let c = this._users.get(userId);
    if (!c) {
      c = await this.fillUsers(userId);
    }

    return c.has(chatId);
  }

  async getChats(userId) {
    let c = this._users.get(userId);
    if (!c) {
      c = await this.fillUsers(userId);
    }

    return Array.from(c.keys());
  }

  async getUsers(chatId) {
    let c = this._chats.get(chatId);
    if (!c) {
      c = await this.fillChats(chatId);
    }

    return Array.from(c.keys());
  }

  async fillUsers(userId) {
    const uchats = await this._dao.UserChat.byUser(userId);

    const chats = new Map();
    uchats.forEach((a) => chats.set(a.chat_id, true));

    this._users.set(userId, chats);
    return chats;
  }

  async fillChats(chatId) {
    const cusers = await this._dao.UserChat.byChat(chatId);

    const users = new Map();
    cusers.forEach((a) => users.set(a.user_id, true));

    this._chats.set(chatId, users);
    return users;
  }
}

module.exports = UsersCache;
