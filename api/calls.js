const {
  CallStatusInitiated,
  CallStatusAccepted,
  CallStatusActive,
  CallStatusRejected,
  CallStatusEnded,
  CallStatusIgnored,
  CallStatusLost,
} = require("../constants");

class CallsAPI {
  constructor(dao, service) {
    this._dao = dao;
    this._service = service;
  }

  async Start(ctx, targetUserId, chatId) {
    const uid = ctx.value("user_id");
    const did = ctx.value("connection_id");

    const check = await this._dao.UsersCache.hasChat(uid, chatId);
    if (!check) throw "access denied";

    const call = await this._dao.Call.start(uid, did, targetUserId, chatId);

    if (call.status != CallStatusRejected) {
      this._service.sendEvent(call);
      this._service.startCall(call.id);
    } else {
      this._service.rejectCall(call);
    }

    return {
      id: call.id,
      status: call.status,
      users: [call.from, call.to],
      start: null,
    };
  }

  async SetStatus(ctx, id, status) {
    const uid = ctx.value("user_id");
    const did = ctx.value("connection_id");

    const call = await this._dao.Call.get(id);

    if (call.from != uid && call.to != uid) {
      throw "Access denied";
    }

    let needToInformOthers = false;
    if (status == CallStatusAccepted && call.to_device == 0) {
      call.to_device = did;
      needToInformOthers = true;
    }

    await this._service.callStatusUpdate(call, status);

    this._service.sendEvent(call);

    if (needToInformOthers) {
      this._service.broadcastToUserDevices(call.to, {
        devices: [call.from_device, call.to_device],
      });
    }

    return call.status;
  }

  async Signal(ctx, signalType, msg) {
    const did = ctx.value("connection_id");
    const hub = ctx.value("hub");

    const call = await this._dao.Call.getByDevice(did);

    let to, toDevice;
    if (call.from_device == did) {
      to = call.to;
      toDevice = call.to_device;
    } else {
      to = call.from;
      toDevice = call.from_device;
    }

    hub.publish("signal", {
      type: signalType,
      msg,
      users: [to],
      devices: [toDevice],
    });
  }
}

module.exports = CallsAPI;
