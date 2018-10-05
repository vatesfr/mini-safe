import getStream from "get-stream";
import Koa from "koa";
import koaStatic from "koa-static";
import { format, parse } from "json-rpc-protocol";

// see https://koajs.com/
const app = new Koa();

var entries = new Map();
let idCounter = 0;

const METHODS = {
  subtract([a, b]) {
    return a - b;
  },

  createEntry([nameEntry, contentEntry]) {
    const entry = {
      id: idCounter,
      name: nameEntry,
      content: contentEntry,
      created: Date.now(),
      updated: Date.now(),
    };

    idCounter += 1;
    entries.set(entry.id, entry);

    return entry.name + " created";
  },

  listEntries() {
    let res = "";
    entries.forEach(function(entry) {
      res +=
        "(" +
        entry.id +
        ") " +
        entry.name +
        " " +
        entry.content +
        " " +
        entry.created +
        " " +
        entry.updated +
        "\n";
    });
    return res;
  },

  deleteEntry([idEntry]) {
    const entry = entries.get(+idEntry);
    if (entry === undefined) {
      return "This entry doesn't exist !";
    }

    entries.delete(+idEntry);
    return "(" + entry.id + ") " + entry.name + " is deleted";
  },

  updateEntry([idEntry, nameEntry, contentEntry]) {
    let res = "This entry doesn't exist !";
    if (nameEntry === undefined || contentEntry === undefined) {
      return "params ? new name & new content expected";
    } else {
      entries.forEach(function(entry) {
        if (entry.id === +idEntry) {
          entry.name = nameEntry;
          entry.content = contentEntry;
          entry.updated = Date.now();
          res = idEntry + " is updated";
        }
      });
    }
    return res;
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
