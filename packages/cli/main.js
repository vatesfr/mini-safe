/* eslint-disable no-console */

import getopts from "getopts";
import hrp from "http-request-plus";
import { format, parse } from "json-rpc-protocol";
import { mapValues, omit } from "lodash";

async function main() {
  const opts = getopts(process.argv.slice(2));
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
main().catch(error => {
  console.error("FATAL: ", error);
  process.exit(1);
});
