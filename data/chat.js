const path = require("path");
const sharp = require("sharp");
const fs = require("fs-extra");
const urljoin = require("url-join");
const { nanoid } = require("nanoid");

class Chat {
  constructor(dao, scheme, config) {
    this._dao = dao;
    this._scheme = scheme;
  }

  async getOne(id) {
    return this._scheme.Chat.findByPk(id);
  }

  async save(c) {
    if (!c.id) {
      await this._scheme.Chat.create(c);
    } else {
      await this._scheme.Chat.update(c, { where: { id: c.id } });
    }
  }

  async addDirect(targetUserId, userId) {
    const userChat = await this._scheme.UserChat.findOne({
      where: { user_id: userId, direct_id: targetUserId },
    });

    // already has a direct chat
    if (userChat) return userChat.id;

    const chat = await this._scheme.Chat.create({});
    await this.setUsersToDB(chat.id, [userId], targetUserId);
    await this.setUsersToDB(chat.id, [targetUserId], userId);

    return chat.id;
  }

  async addGroup(name, avatar, users) {
    const chat = await this._scheme.Chat.create({ name, avatar });
    await this.setUsersToDB(chat.id, users, 0);
    return chat.id;
  }

  async setUsers(chatId, users) {
    const uChat = await this._dao.UserChat.byChat(chatId);
    if (uChat[0].direct_id > 0) {
      // when adding people to private chate - create new group chat
      const name = await this._dao.User.getGroupName(users);
      chatId = await this.addGroup(name, "", users);
    } else {
      await this.setUsersToDB(chatId, users, 0);
    }

    return chatId;
  }

  async leave(chatId, userId) {
    await this.leaveChat(chatId, userId);

    // check is that was the last user
    const res = await this._scheme.DB.query(
      "select count(id) as ccount from user_chats where chat_id = ?",
      {
        replacements: [chatId],
        type: this._scheme.DB.QueryTypes.SELECT,
      }
    );

    // delete chat where no more users
    if (res[0].ccount > 0) return;

    await this._scheme.Chat.destroy({ where: { id: chatId } });
  }

  async setLastMessage(chatId, msg) {
    if (!msg) msg = await this._scheme.Message.getLast(chatId);

    await this._scheme.Chat.update(
      { last_message: msg.id },
      {
        where: { id: chatId },
      }
    );
    return msg;
  }

  async setUsersToDB(chat, next, direct) {
    await Promise.all(
      next.map(async (u) => {
        const has = await this._dao.UsersCache.hasChat(u, chat);
        if (!has) {
          await this._scheme.UserChat.create({
            chat_id: chat,
            direct_id: direct,
            user_id: u,
          });

          this._dao.UsersCache.joinChat(u, chat);
        }
      })
    );

    if (!direct) {
      const users = await this._dao.UsersCache.getUsers(chat);
      await Promise.all(
        users.map(async (u) => {
          const found = !!next.find((a) => a == u);
          if (!found) {
            await this.leaveChat(chat, u);
          }
        })
      );
    }
  }

  async leaveChat(chatId, userId) {
    const num = await this._scheme.UserChat.destroy({
      where: {
        chat_id: chatId,
        user_id: userId,
        direct_id: 0,
      },
    });

    if (num) {
      await this._dao.UsersCache.leaveChat(userId, chatId);
    }
  }

  async update(id, name, avatar) {
    return this._scheme.Chat.update(
      {
        name,
        avatar,
      },
      { where: { id } }
    );
  }

  async updateAvatar(id, data, dataRoot, server) {
    if (!id) throw "wrong chat id";

    let target = "";
    let base = "";
    while (!target) {
      base = nanoid(8) + ".jpg";
      target = path.join(dataRoot, base);
      try {
        await fs.access(target);
        target = "";
      } catch (e) {
        // do nothing
      }
    }

    await this._getImagePreview(data, 300, 300, target);
    const avatar = this._getAvatarURL(id, base, server);

    // get existing chat
    await this._scheme.Chat.update(
      {
        avatar,
      },
      {
        where: { id },
      }
    );

    return avatar;
  }

  _getAvatarURL(id, name, server) {
    return server + urljoin("/api/v1/chat", id.toString(), "avatar", name);
  }

  async _getImagePreview(data, width, height, target) {
    const out = await sharp(data).resize(width, height).toBuffer();
    await fs.writeFile(target, out);
  }
}

module.exports = Chat;
