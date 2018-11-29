/* eslint-disable no-console */

import getopts from "getopts";
import hrp from "http-request-plus";
import { format, parse } from "json-rpc-protocol";
import { mapValues, omit } from "lodash";
const WebSocket = require("ws");

async function main() {
<<<<<<< HEAD
  const opts = getopts(process.argv.slice(2));
  const method = opts._[0];
  const params = mapValues(omit(opts, "_"), String);
||||||| merged common ancestors
  const params = require("minimist")(process.argv.slice(2));
  const method = params._[0];
=======
  const getopts = require("getopts");
  const params = getopts(process.argv.slice(2));
  const method = params._[0];
>>>>>>> fix(cli): option watch using getopts

<<<<<<< HEAD
  if (method === "displayEvents") {
    const websocket = new WebSocket("ws://localhost:4000");
||||||| merged common ancestors
  if (method === "displayEvents") {
    let websocket = new WebSocket("ws://localhost:4000");
=======
  if (params.watch) {
    const websocket = new WebSocket("ws://localhost:4000");
>>>>>>> fix(cli): option watch using getopts

    websocket.onerror = function(event) {
      console.error(event);
    };
    websocket.onmessage = event => {
      const message = parse(event.data);
      if (message.type !== "notification") {
        return;
      }
      console.log(
        "method: %s\n %s\n",
        message.method,
<<<<<<< HEAD
        JSON.stringify(message.params, { showHiddent: true })
||||||| merged common ancestors
        util.inspect(message.params, { showHiddent: true })
=======
        JSON.stringify(message.params)
>>>>>>> fix(cli): option watch using getopts
      );
    };
  } else {
    const response = parse(
      await hrp
        .post("http://localhost:4000/api/", {
          body: format.request(0, method, params),
        })
        .readAll("utf-8")
    );

    if (response.type === "response") {
      console.log(response.result);
    } else if (response.type === "error") {
      console.error(response.error);
    }
  }
}
main().catch(error => {
  console.error("FATAL: ", error);
  process.exit(1);
});
