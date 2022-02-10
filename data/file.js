const fs = require("fs-extra");
const path = require("path");
const sharp = require("sharp");
const { nanoid } = require("nanoid");
const { AttachedFile } = require("../constants");

class File {
  constructor(dao, scheme) {
    this._dao = dao;
    this._scheme = scheme;
  }

  async postFile(chat_id, user_id, data, name, dataRoot, server) {
    if (!chat_id) throw "wrong chat id";

    let target = "";
    let base = "";
    while (!target) {
      base = nanoid(8);
      target = path.join(dataRoot, base);
      try {
        await fs.access(target);
        target = "";
      } catch (e) {
        // do nothing
      }
    }

    await fs.copyFile(data, target);

    const tf = {
      name,
      path: base,
      chat_id,
      uid: base,
    };
    const fid = (await this._scheme.File.create(tf)).id;
    const url = this._getFileUrl(server, base, name);

    const size = (await fs.stat(target)).size;
    let mText = url + "\n" + name + "\n" + size;

    const ext = path.extname(name.toLowerCase());
    if (ext == ".jpeg" || ext == ".jpg" || ext == ".png" || ext == ".gif") {
      try {
        let previewTarget = target + ".preview";
        await this._getImagePreview(data, 300, 300, previewTarget);
        mText = mText + "\n" + this._getPreviewUrl(server, base, name);
      } catch (e) {
        console.log("can't create preview:", e);
      }
    }

    const msg = {
      text: mText,
      date: new Date(),
      chat_id,
      user_id,
      type: AttachedFile,
      related: fid,
    };
    await this._dao.Message.saveAndSend(chat_id, msg, "", 0);
  }

  async getOne(uid) {
    return this._scheme.File.findOne({
      where: { uid },
    });
  }

  _getPreviewUrl(server, uid, name) {
    return server + path.join("/api/v1/files", uid, "preview", name);
  }
  _getFileUrl(server, uid, name) {
    return server + path.join("/api/v1/files", uid, name);
  }
  async _getImagePreview(data, width, height, target) {
    const out = await sharp(data).resize(width, height).toBuffer();
    await fs.writeFile(target, out);
  }
}

module.exports = File;
