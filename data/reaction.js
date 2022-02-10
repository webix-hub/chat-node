class Reaction {
  constructor(dao, scheme, config) {
    this._dao = dao;
    this._scheme = scheme;
  }

  async add(reaction) {
    if (await this.exists(reaction)) {
      throw "record already exists";
    }

    return this._scheme.Reaction.create(reaction);
  }

  async remove(reaction) {
    return this._scheme.Reaction.destroy({
      where: {
        message_id: reaction.message_id,
        reaction: reaction.reaction,
        user_id: reaction.user_id,
      },
    });
  }

  async getAllForChat(chatId) {
    return this._scheme.DB.query(
      `
            select r.id, r.message_id, r.reaction, r.user_id 
            from messages m
            join reactions r on m.id = r.message_id and m.chat_id = ?
        `,
      {
        replacements: [chatId],
        type: this._scheme.DB.QueryTypes.SELECT,
      }
    );
  }

  async getAllForMessage(msgId) {
    const data = await this._scheme.Reaction.findAll({
      where: {
        message_id: msgId,
      },
    });

    return this.toMap(data);
  }

  toMap(reactions) {
    const out = {};
    reactions.forEach((r) => {
      let temp = out[r.reaction];
      if (temp) temp.push(r.user_id);
      else out[r.reaction] = [r.user_id];
    });

    return out;
  }

  setReactions(msgs, all) {
    if (!all.length) return;

    const mMap = new Map();
    for (let i = msgs.length - 1; i >= 0; i--) mMap.set(msgs[i].id, msgs[i]);

    all.forEach((r) => {
      const msg = mMap.get(r.message_id);
      if (msg) {
        const reactions = msg.reactions;
        if (!reactions) msg.reactions = { [r.reaction]: [r.user_id] };
        else {
          const arr = reactions[r.reaction];
          if (!arr) reactions[r.reaction] = [r.user_id];
          else arr.push(r.user_id);
        }
      }
    });
  }

  async exists(robj) {
    const found = await this._scheme.Reaction.findAll({
      where: {
        message_id: robj.message_id,
        reaction: robj.reaction,
        user_id: robj.user_id,
      },
    });

    return found.length != 0;
  }
}

module.exports = Reaction;
