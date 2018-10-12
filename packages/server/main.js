import getStream from "get-stream";
import Koa from "koa";
import koaStatic from "koa-static";
import { format, parse } from "json-rpc-protocol";

// see https://koajs.com/
const app = new Koa();

var entries = new Map();
let idCounter = 0;

function generateId() {
  return (idCounter += 1);
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

    return entry.id;
  },

  listEntries() {
    return Array.from(entries);
  },

  deleteEntry({ id }) {
    if (!entries.delete(+id)) {
      throw new Error(`could not find entry ${id}`);
    }
  },

  updateEntry({ id, name, content }) {
    if (name === undefined && content === undefined) {
      throw new Error(`could not update entry ${id}, name or content expected`);
    }

    const entry = entries.get(+id);
    if (entry === undefined) {
      throw new Error(`could not find entry ${id}`);
    }

    if (name !== undefined) {
      entry.name = name;
    }

    if (content !== undefined) {
      entry.content = content;
    }

    entry.updated = Date.now();
    entries.set(+id, entry);
  },

  deleteEntries() {
    entries.clear();
  },
};

app.use(async (ctx, next) => {
  if (ctx.path !== "/api/") {
    return next();
  }

  const request = parse(await getStream(ctx.req));
  if (request.type !== "request") {
    throw new Error("invalid JSON-RPC message, expected request");
  }

  const method = METHODS[request.method];
  if (method === undefined) {
    throw new Error(`could not find method ${request.method}`);
  }

  const result = method(request.params);
  ctx.body = format.response(request.id, result === undefined ? true : result);
});

app.use(koaStatic(`${__dirname}/../pages/build`));

app.listen(3000);
