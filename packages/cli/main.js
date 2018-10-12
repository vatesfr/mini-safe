/* eslint-disable no-console */

import hrp from "http-request-plus";
import { format, parse } from "json-rpc-protocol";

async function main() {
  const params = require("minimist")(process.argv.slice(2));
  const method = params._[0];

  const response = parse(
    await hrp
      .post("http://localhost:3000/api/", {
        body: format.request(0, method, params),
      })
      .readAll("utf-8")
  );

  if (response.type === "response") {
    if (response.result !== undefined) {
      console.log(response.result);
    }
  } else if (response.type === "error") {
    console.log(response.error.message + " - " + response.error.data);
  }
}
main().catch(console.error.bind(console, "FATAL:"));
