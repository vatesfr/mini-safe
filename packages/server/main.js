import getStream from "get-stream";
import Koa from "koa";
import koaStatic from "koa-static";
import { format, parse } from "json-rpc-protocol";

// see https://koajs.com/
const app = new Koa();

var entries = new Map();
let idCounter = 0;

function generateId() {
  return idCounter += 1;
}

const METHODS = {
  createEntry([nameEntry, contentEntry]) {
    const entry = {
      id: generateId(),
      name: nameEntry,
      content: contentEntry,
      created: Date.now(),
      updated: Date.now(),
    };

    entries.set(entry.id, entry);

    return entry.id;
  },

  listEntries() {
    return Array.from(entries);
  },

  deleteEntry([idEntry]) {
    if (entries.delete(+idEntry) === undefined) {
      throw new Error(`could not find entry ${idEntry}`);
    }
  },

  updateEntry([idEntry, nameEntry, contentEntry]) {
    if (nameEntry === undefined || contentEntry === undefined) {
      throw new Error(
        `could not update entry ${idEntry}, name & content expected`
      );
    }

    const entry = entries.get(+idEntry);
    if (entry === undefined) {
      throw new Error(`could not find entry ${idEntry}`);
    }
    
    entry.name = nameEntry;
    entry.content = contentEntry;
    entry.updated = Date.now();
    entries.set(+idEntry, entry);
  }
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
