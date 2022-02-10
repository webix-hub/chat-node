const {
  CallStatusInitiated,
  CallStatusRejected,
  CallStatusEnded,
  CallStatusIgnored,
  CallStatusLost,

  CallStartMessage,
  CallMissedMessage,
  CallRejectedMessage,

  StatusOnline,
  StatusOffline,
} = require("../constants");

class CallService {
  constructor(dao, hub) {
    this._dao = dao;
    this._hub = hub;
    this._offline = new Map();

    this.runCheckOfflineUsers();
  }

  startCall(id) {
    setTimeout(() => this.dropNotAccepted(id), 30 * 1000);
  }

  async dropNotAccepted(id) {
    const call = await this._dao.Call.get(id);

    if (call.status == CallStatusInitiated) {
      await this.callStatusUpdate(call, CallStatusIgnored);
      this.sendEvent(call);
    }
  }

  changeOnlineStatus(device, status) {
    if (status == StatusOnline) {
      this._offline.delete(device);
      return;
    }

    if (status == StatusOffline) {
      this._offline.set(device, new Date());
    }
  }

  sendEvent(c) {
    const msg = {
      id: c.id,
      status: c.status,
      start: c.start,
      users: [c.from, c.to],
    };
    this._hub.publish("signal", {
      type: "connect",
      msg: JSON.stringify(msg),
      users: [c.from, c.to],
      devices: [c.from_device, c.to_device],
    });
  }

  runCheckOfflineUsers() {
    setInterval(() => this.checkOfflineUsers(), 10 * 1000);
  }

  async checkOfflineUsers() {
    if (this._offline.size == 0) {
      return;
    }

    const check = new Date().valueOf() - 15000;
    const all = Array.from(this._offline.keys());
    all.forEach(async (key) => {
      const offTime = this._offline.get(key);
      if (offTime.valueOf() < check) {
        const c = await this._dao.Call.getByDevice(key);
        if (c) {
          this.callStatusUpdate(c, CallStatusLost);
          this.sendEvent(c);
        }

        this._offline.delete(key);
      }
    });
  }

  broadcastToUserDevices(targetUser, payload) {
    const msg = JSON.stringify(payload);
    this._hub.publish("signal", {
      type: "connect",
      msg: msg,
      users: [targetUser],
      devices: [0],
    });
  }

  async callStatusUpdate(c, status) {
    await this._dao.Call.update(c, status);

    if (
      (status == CallStatusEnded || status == CallStatusLost) &&
      c.chat_id != 0
    ) {
      const diff = c.start
        ? (new Date().valueOf() - c.start.valueOf()) / 1000
        : 0;
      const msg = {
        date: c.start,
        text: formatTime(diff),
        chat_id: c.chat_id,
        user_id: c.from,
        type: CallStartMessage,
      };

      await this._dao.Message.save(msg);
      await this.sendMessage(c, msg);
    }

    if (status == CallStatusRejected && c.chat_id != 0) {
      return this.rejectCall(c);
    }

    if (status == CallStatusIgnored && c.chat_id != 0) {
      const msg = {
        text: "",
        chat_id: c.chat_id,
        user_id: c.from,
        type: CallMissedMessage,
      };

      await this._dao.Message.save(msg);
      await this.sendMessage(c, msg);
    }
  }

  async sendMessage(c, msg) {
    this._hub.publish("messages", { op: "add", msg: msg });

    await this._dao.UserChat.incrementCounter(c.chat_id, c.from);
    await this._dao.Chat.setLastMessage(c.chat_id, msg);
  }

  async rejectCall(c) {
    const msg = {
      text: "",
      chat_id: c.chat_id,
      user_id: c.from,
      type: CallRejectedMessage,
    };

    await this._dao.Message.save(msg);
    this.sendMessage(c, msg);
  }
}

function formatTime(diff) {
  return twoDigits(diff / 60) + ":" + twoDigits(diff % 60);
}
function twoDigits(num) {
  num = Math.round(num);
  if (num === 0) return "00";
  if (num < 10) return "0" + num;
  return num.toString();
}

module.exports = CallService;
