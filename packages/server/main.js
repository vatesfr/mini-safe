import getStream from "get-stream";
import Koa from "koa";
import koaStatic from "koa-static";
import {
  format,
  parse,
  JsonRpcError,
  InvalidRequest,
  InvalidParameters,
  MethodNotFound,
} from "json-rpc-protocol";
const http = require("http");
const WebSocket = require("ws");

// see https://koajs.com/
const app = new Koa();

var clients = new Set();
var entries = new Map();
let idCounter = 0;

function generateId() {
  return String((idCounter += 1));
}

function notifyClients(method, params) {
  const message = format.notification(method, params);
  clients.forEach(client => {
    client.send(message);
  });
}

const METHODS = {
  createEntry({ name, content }) {
    const entry = {
      id: generateId(),
      name,
      content,
      created: Date.now(),
      updated: Date.now(),
    };

    entries.set(entry.id, entry);
    notifyClients("createEntry", { entry });

    return entry.id;
  },

  listEntries() {
    return Array.from(entries.values());
  },

  deleteEntry({ id }) {
    if (!entries.delete(id)) {
      throw new InvalidParameters(`could not find entry ${id}`);
    }
    notifyClients("deleteEntry", { id });
  },

  updateEntry({ id, name, content }) {
    if (name === undefined && content === undefined) {
      throw new InvalidParameters(
        `could not update entry ${id}, name or content expected`
      );
    }

    const entry = entries.get(id);
    if (entry === undefined) {
      throw new InvalidParameters(`could not find entry ${id}`);
    }

    if (name !== undefined) {
      entry.name = name;
    }

    if (content !== undefined) {
      entry.content = content;
    }

    entry.updated = Date.now();
    entries.set(id, entry);
    notifyClients("updateEntry", { entry });
  },
};

app.use(async (ctx, next) => {
  if (ctx.path !== "/api/") {
    return next();
  }

  try {
    const request = parse(await getStream(ctx.req));
    if (request.type !== "request") {
      throw new InvalidRequest();
    }
    const method = METHODS[request.method];
    if (method === undefined) {
      throw new MethodNotFound(request.method);
    }
    const result = method(request.params);
    ctx.body = format.response(
      request.id,
      result === undefined ? true : result
    );
  } catch (err) {
    ctx.body = format.error(
      0,
      new JsonRpcError(err.message, err.code, err.data)
    );
  }
});

app.use(koaStatic(`${__dirname}/../pages/build`));

const server = http.createServer(app.callback());
const wss = new WebSocket.Server({ server });

wss.on("connection", function(wss) {
  clients.add(wss);

  wss.on("close", function() {
    clients.delete(wss);
  });
});

server.listen(4000);
console.log("server is listening on http://localhost:4000");
