const config = require("./config");

const Koa = require("koa");
const Router = require("koa-router");
const bodyParser = require("koa-body");
const cors = require("@koa/cors");
const send = require("koa-send");
const koaHandler = require("node-remote").koaHandler;

const path = require("path");
const fs = require("fs-extra");
const { createUserToken, verifyUserToken } = require("./jwt");

(async function () {
  const baseDir = path.resolve(config.server.data);
  const avatarsDir = path.join(baseDir, "avatars");
  await fs.ensureDir(avatarsDir);
  const filesDir = path.join(baseDir, "files");
  await fs.ensureDir(filesDir);

  // init data models
  const scheme = await require("./store/init")(config);

  const app = new Koa();

  // routes
  const router = new Router();
  router.get("/login", async (ctx) => {
    // DEMO ONLY
    const uid = ctx.query.id * 1;
    const did = Math.ceil(Math.random() * 5000000);
    ctx.body = await createUserToken(uid, did);
  });

  //init data
  const dao = require("./data")(scheme, config.features);

  //init api
  const api = require("./api")(dao, config.features);
  router.all("/api/v1", koaHandler(api));
  dao.Message.$linkHub(api.events);

  router.post("/api/v1/chat/:chatid/file", async function (ctx) {
    if (!config.features.files) throw "feature disabled";

    const file = ctx.request.files.upload;
    const id = parseInt(ctx.params.chatid);
    const uid = ctx.state.user_id;

    await dao.File.postFile(
      id,
      uid,
      file.path,
      file.name,
      filesDir,
      config.server.public
    );
    ctx.body = { status: "server" };
  });
  router.get("/api/v1/files/:fileid/:name", async function (ctx) {
    if (!config.features.files) throw "feature disabled";

    const fid = ctx.params.fileid;
    const fInfo = await dao.File.getOne(fid);

    if (fInfo.id == 0) {
      http.Error(w, "", http.StatusNotFound);
      return;
    }

    await send(ctx, fInfo.path, { root: filesDir });
  });
  router.get("/api/v1/files/:fileid/preview/:name", async function (ctx) {
    if (!config.features.files) throw "feature disabled";

    const fid = ctx.params.fileid;
    const fInfo = await dao.File.getOne(fid);

    if (fInfo.id == 0) {
      http.Error(w, "", http.StatusNotFound);
      return;
    }

    await send(ctx, fInfo.path + ".preview", { root: filesDir });
  });

  router.post("/api/v1/chat/:chatid/avatar", async function (ctx) {
    const file = ctx.request.files.upload;
    const id = parseInt(ctx.params.chatid);
    const url = await dao.Chat.updateAvatar(
      id,
      file.path,
      avatarsDir,
      config.server.public
    );

    fs.unlink(file.path);
    ctx.body = { status: "server", value: url };
  });

  router.get("/api/v1/chat/:chatid/avatar/:filename", async function (ctx) {
    const name = ctx.params.filename;
    await send(ctx, name, { root: avatarsDir });
  });

  const getUserAndDevice = async (ctx, next) => {
    let token = ctx.get("Remote-Token");
    if (!token) token = ctx.query.token;

    if (token) {
      const utx = verifyUserToken(token);
      ctx.state.user_id = utx.id;
      ctx.state.device_id = utx.device;
    }
    await next();
  };

  console.log(`starting server at http://localhost:${config.server.port}`);

  app;
  app
    .use(
      cors({
        allowHeaders: ["Remote-Token", "content-type"],
        credentials: true,
      })
    )
    .use(bodyParser({ multipart: true, urlencoded: true }))
    .use(getUserAndDevice)
    .use(router.routes())
    .use(router.allowedMethods())
    // start
    .listen(config.server.port);
})();
