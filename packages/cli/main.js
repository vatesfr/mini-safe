import getopts from "getopts";
import hrp from "http-request-plus";
import { format, parse } from "json-rpc-protocol";
import { mapValues, omit } from "lodash";
import WebSocket from "ws";

async function main() {
  const args = process.argv.slice(2);
  const { watch } = getopts(args, { stopEarly: true });

  if (watch) {
    const websocket = new WebSocket("ws://localhost:4000");

    websocket.onerror = event => {
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
        JSON.stringify(message.params)
      );
    };
  } else {
    const opts = getopts(args);
    const method = opts._[0];
    const params = mapValues(omit(opts, "_"), String);
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
