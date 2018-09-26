import Koa from "koa";
import koaStatic from "koa-static";

// see https://koajs.com/
const app = new Koa();

app.use(koaStatic(`${__dirname}/../pages/build`));

app.listen(3000);
