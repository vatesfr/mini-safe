import getStream from "get-stream";
import Koa from "koa";
import koaStatic from "koa-static";
import { format, parse } from "json-rpc-protocol";

// see https://koajs.com/
const app = new Koa();

const METHODS = {
  subtract([a, b]) {
    return a - b;
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
