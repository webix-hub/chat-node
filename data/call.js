const {
  CallStatusInitiated,
  CallStatusAccepted,
  CallStatusActive,
  CallStatusRejected,
  CallStatusEnded,
  CallStatusIgnored,
  CallStatusLost,
} = require("../constants");

class Call {
  constructor(dao, scheme, config) {
    this._dao = dao;
    this._scheme = scheme;
  }

  async start(from, device, to, chatId) {
    const checkCalls = await this._scheme.DB.query(
      "select * from calls " +
        "where (`from` IN(?,?) or `to` IN (?,?) ) and (status = ? or status = ?)",
      {
        replacements: [
          from,
          to,
          from,
          to,
          CallStatusActive,
          CallStatusInitiated,
        ],
        type: this._scheme.DB.QueryTypes.SELECT,
      }
    );

    const check = checkCalls[0];
    if (check && (check.from == from || check.to == from)) {
      throw "already in the call";
    }

    const call = {
      from: from,
      from_device: device,
      to: to,
      to_device: 0,
      status: CallStatusInitiated,
      chat_id: chatId,
    };

    if (check) call.status = CallStatusRejected;
    return this._scheme.Call.create(call);
  }

  async get(id) {
    const obj = await this._scheme.Call.findByPk(id);
    return obj.get();
  }

  async getByUser(id, device) {
    const all = await this._scheme.DB.query(
      "select * from calls " +
        "where ((`from`=? and (`from_device` = ? or `from_device` = 0)) or (`to`=? and (`to_device` = ? or `to_device` = 0))) " +
        "and status < 900 ",
      {
        replacements: [id, device, id, device],
        type: this._scheme.DB.QueryTypes.SELECT,
      }
    );

    return all[0];
  }

  async update(call, status) {
    if (status == CallStatusAccepted) {
      status = CallStatusActive;
      call.start = new Date();
    }

    call.status = status;
    return this._scheme.Call.update(call, {
      where: { id: call.id },
    });
  }

  async getByDevice(id) {
    const all = await this._scheme.DB.query(
      "select * from calls " +
        "where (`from_device`=? or `to_device` = ?) " +
        "and status < 900 ",
      {
        replacements: [id, id],
        type: this._scheme.DB.QueryTypes.SELECT,
      }
    );

    return all[0];
  }
}

module.exports = Call;
