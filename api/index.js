const Server = require("node-remote").Server;
const { StatusOffline, StatusOnline } = require("../constants");

const Calls = require("./calls");
const Chats = require("./chats");
const Messages = require("./messages");
const CallService = require("./services");

function init(dao, config) {
  const api = new Server({ websocket: true });
  api.connect = (ctx, req) => {
    const uid = req.state.user_id;
    if (!uid) throw "access denied";
    ctx.setValue("user_id", uid * 1);

    const did = req.state.device_id;
    if (!did) throw "access denied";
    ctx.setValue("connection_id", did * 1);
  };

  const service = new CallService(dao, api.events);

  api.addService("call", new Calls(dao, service));
  api.addService("chat", new Chats(dao));
  api.addService("message", new Messages(dao, config));
  api.addService("debug", {
    status: (_, name, params) => api.events.statusChannel(name, params),
    users: () => api.events.statusUser(),
  });

  api.addVariable("user", async (ctx) => ctx.value("user_id"));
  api.addVariable("device", async (ctx) => ctx.value("connection_id"));
  api.addVariable("chats", async (ctx) => {
    const uid = ctx.value("user_id");
    return dao.UserChat.getAll(uid);
  });
  api.addVariable("users", async (ctx) => {
    const uid = ctx.value("user_id");
    return dao.User.getAll(uid);
  });
  api.addVariable("call", async (ctx) => {
    const uid = ctx.value("user_id");
    const did = ctx.value("connection_id");

    const call = await dao.Call.getByUser(uid, did);
    if (!call) return { id: 0, status: 0, users: [] };

    return {
      id: call.id,
      status: call.status,
      users: [call.from, call.to],
      start: call.start,
    };
  });

  api.dependencies.addProvider("hub", () => api.events);

  api.events.addGuard("messages", async (ctx, m) => {
    const check = await dao.UsersCache.hasChat(
      ctx.value("user_id"),
      m.msg.chat_id
    );
    return check && m.from != ctx.value("connection_id");
  });

  api.events.addGuard("chats", async (ctx, m) => {
    // do not messages to action initiator
    if (m.from == ctx.value("connection_id")) return false;
    // if defined check against the whitelist
    if (m.to && m.to.indexOf(ctx.value("user_id")) != -1) return true;

    // fallback to chat-access rights check
    return await dao.UsersCache.hasChat(ctx.value("user_id"), m.chat_id);
  });

  api.events.addGuard("signal", async (ctx, m) => {
    const uid = ctx.value("user_id");
    const did = ctx.value("connection_id");

    for (let i = m.users.length; i >= 0; i--) {
      if (m.users[i] == uid) {
        if (m.devices[i] == 0 || m.devices[i] == did) {
          return true;
        }
      }
    }

    return false;
  });

  api.events.userHandler = (id, state) => {
    const data = state ? StatusOnline : StatusOffline;
    api.events.publish("users", {
      op: "online",
      user_id: id,
      data,
    });
    dao.User.changeOnlineStatus(id, data);
  };

  api.events.connHandler = (id, state) => {
    const data = state ? StatusOnline : StatusOffline;
    service.changeOnlineStatus(id, data);
  };

  return api;
}

module.exports = init;
