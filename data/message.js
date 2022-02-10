class Message {
  constructor(dao, scheme, config) {
    this._dao = dao;
    this._scheme = scheme;
    this._config = config;
  }

  $linkHub(hub) {
    this._hub = hub;
  }

  async getOne(id) {
    const msg = await this._scheme.Message.findByPk(id);
    const rawMsg = msg ? msg.get() : null;

    if (this._config.reactions) {
      rawMsg.reactions = await this._dao.Reaction.getAllForMessage(id);
    }

    return rawMsg;
  }

  async getLast(chatId) {
    const msg = await this._scheme.Message.findOne({
      where: { chat_id: chatId },
      order: [["date", "DESC"]],
    });
    const rawMsg = msg ? msg.get() : null;

    if (this._config.reactions) {
      rawMsg.reactions = await this._dao.Reaction.getAllForMessage(t.ID);
    }

    return rawMsg;
  }

  async getAll(id) {
    const msgs = await this._scheme.Message.findAll({
      where: { chat_id: id },
      order: [["date", "ASC"]],
    });
    const rawMsgs = msgs.map((a) => a.get());

    if (this._config.reactions) {
      const reactions = await this._dao.Reaction.getAllForChat(id);
      this._dao.Reaction.setReactions(rawMsgs, reactions);
    }

    return rawMsgs;
  }

  async save(m) {
    m.date = new Date();
    if (!m.id) {
      const res = await this._scheme.Message.create(m);
      m.id = res.id;
      return res;
    } else return this._scheme.Message.update(m, { where: { id: m.id } });
  }

  async saveAndSend(chat_id, msg, origin, from) {
    await this.save(msg);
    await this.send(chat_id, msg, origin, from);
  }

  async send(chat_id, msg, origin, from) {
    this._hub.publish("messages", {
      op: "add",
      msg,
      origin,
      from,
    });

    await this._dao.UserChat.incrementCounter(chat_id, msg.user_id);
    await this._dao.Chat.setLastMessage(chat_id, msg);
  }

  async delete(id) {
    await this._scheme.Message.destroy({
      where: { id },
    });

    if (this._config.reactions) {
      await this._scheme.Reaction.destroy({
        where: { message_id: id },
      });
    }
  }
}

module.exports = Message;
