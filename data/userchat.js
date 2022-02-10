const getUserChatsSQL =
  "select chats.id, chats.name, chats.avatar, " +
  "user_chats.direct_id, user_chats.status, user_chats.unread_count, " +
  "messages.text as message, messages.type as messagetype, messages.date " +
  "from user_chats " +
  "inner join chats on user_chats.chat_id = chats.id " +
  "left outer join messages on chats.last_message = messages.id " +
  "where user_chats.user_id = ? " +
  "order by messages.date desc";

const getUserChatSQL =
  "select chats.id, chats.name, chats.avatar, " +
  "user_chats.direct_id, user_chats.status, user_chats.unread_count, " +
  "messages.text as message, messages.type as messagetype, messages.date " +
  "from user_chats " +
  "inner join chats on user_chats.chat_id = chats.id " +
  "left outer join messages on chats.last_message = messages.id " +
  "where user_chats.chat_id = ? AND user_chats.user_id = ? " +
  "order by messages.date desc";

const getUserChatLeaveSQL =
  "select chats.id, chats.name, chats.avatar, " +
  "messages.text as message, messages.type as messagetype, messages.date " +
  "from chats " +
  "left outer join messages on chats.last_message = messages.id " +
  "where chats.id = ?";

class UserChat {
  constructor(dao, scheme, config) {
    this._dao = dao;
    this._scheme = scheme;
  }

  async getAll(userId) {
    const uchats = await this._scheme.DB.query(getUserChatsSQL, {
      replacements: [userId],
      type: this._scheme.DB.QueryTypes.SELECT,
    });

    await Promise.all(
      uchats.map(
        async (a) => (a.users = await this._dao.UsersCache.getUsers(a.id))
      )
    );
    return uchats;
  }

  async getOne(chatId, userId) {
    const uchats = await this._scheme.DB.query(getUserChatSQL, {
      replacements: [chatId, userId],
      type: this._scheme.DB.QueryTypes.SELECT,
    });

    const uc = uchats[0];
    uc.users = await this._dao.UsersCache.getUsers(chatId);
    return uc;
  }

  async getOneLeaved(chatId) {
    const uchats = await this._scheme.DB.query(getUserChatLeaveSQL, {
      replacements: [chatId],
      type: this._scheme.DB.QueryTypes.SELECT,
    });

    const uc = uchats[0];
    uc.users = this._dao.UsersCache.getUsers(chatId);
    return uc;
  }

  async byUser(userId) {
    return this._scheme.UserChat.findAll({
      where: { user_id: userId },
    });
  }

  async byChat(chatId) {
    return this._scheme.UserChat.findAll({
      where: { chat_id: chatId },
    });
  }

  async resetCounter(chatId, userId) {
    return this._scheme.UserChat.update(
      {
        unread_count: 0,
      },
      {
        where: {
          chat_id: chatId,
          user_id: userId,
        },
      }
    );
  }

  async byChat(chatId) {
    return this._scheme.UserChat.findAll({
      where: { chat_id: chatId },
    });
  }

  async incrementCounter(chatId, userId) {
    return this._scheme.UserChat.update(
      {
        unread_count: this._scheme.Literal("unread_count + 1"),
      },
      {
        where: {
          chat_id: chatId,
          user_id: userId,
        },
      }
    );
  }
}

module.exports = UserChat;
