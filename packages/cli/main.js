/* eslint-disable no-console */

import hrp from "http-request-plus";
import { format, parse } from "json-rpc-protocol";

async function main() {
  const params = require('minimist')(process.argv.slice(2), {
    alias: {
      m: 'method',
      i: 'id',
      n: 'name',
      c: 'content'
    }
  });

  const response = parse(
    await hrp
      .post("http://localhost:3000/api/", {
        body: format.request(0, params.method, params),
      })
      .readAll("utf-8")
  );

  console.log(response.result);
}
main().catch(console.error.bind(console, "FATAL:"));
