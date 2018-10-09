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
  createEntry(params) {
    const entry = {
      id: generateId(),
      name: params.name,
      content: params.content,
      created: Date.now(),
      updated: Date.now(),
    };

    entries.set(entry.id, entry);

    return entry.id;
  },

  listEntries() {
    return Array.from(entries);
  },

  deleteEntry(params) {
    if (!entries.delete(+params.id)) {
      throw new Error(`could not find entry ${params.id}`);
    }
  },

  updateEntry(params) {
    if (params.name === undefined && params.content === undefined) {
      throw new Error(
        `could not update entry ${params.id}, name or content expected`
      );
    }

    const entry = entries.get(+params.id);
    if (entry === undefined) {
      throw new Error(`could not find entry ${params.id}`);
    }
    
    if (params.name !== undefined) {
      entry.name = params.name;
    }

    if (params.content !== undefined) {
      entry.content = params.content;  
    }
    
    entry.updated = Date.now();
    entries.set(+params.id, entry);
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
  ctx.body = format.response(request.id, result);
});

app.use(koaStatic(`${__dirname}/../pages/build`));

app.listen(3000);