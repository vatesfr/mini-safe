/* eslint-disable no-console */

import getopts from "getopts";
import hrp from "http-request-plus";
import { format, parse } from "json-rpc-protocol";
import { mapValues, omit } from "lodash";
import * as WebSocket from "ws";

async function main() {
  async function call(method, params) {
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

  let opts = getopts(process.argv.slice(2), {
    stopEarly: true,
  });

  if (opts.watch) {
    const websocket = new WebSocket("ws://localhost:4000");

    websocket.onerror = event => {
      console.error(event);
    };

    if (opts.watch !== true) {
      call(opts.watch, mapValues(omit(opts, "_"), String));
    }

    websocket.onmessage = event => {
      const message = parse(event.data);
      if (message.type !== "notification") {
        return;
      }
      console.log(
        "method: %s\n %s\n",
        message.method,
        JSON.stringify(message.params)
      );
    };
  } else {
    opts = getopts(opts._);
    call(opts._[0], mapValues(omit(opts, "_"), String));
  }
}
main().catch(error => {
  console.error("FATAL: ", error);
  process.exit(1);
});
