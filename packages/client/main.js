/* eslint-disable no-console */

import hrp from "http-request-plus";
import {
  format,
  parse,
  JsonRpcError,
  InvalidRequest,
  InvalidParameters,
  MethodNotFound,
} from "json-rpc-protocol";
import assert from "assert";

async function main() {
  var map = new Map();
  let idCounter = 0;

  map.set(idCounter++, { method: "deleteEntries" });
  map.set(idCounter++, { method: "listEntries" });
  map.set(idCounter++, {
    method: "createEntry",
    params: { name: "name1", content: "content1" },
  });
  map.set(idCounter++, {
    method: "createEntry",
    params: { name: "name2", content: "content2" },
  });
  map.set(idCounter++, {
    method: "createEntry",
    params: { name: "name3", content: "content3" },
  });
  map.set(idCounter++, {
    method: "listEntries",
    test:
      "assert.deepEqual(response.result[0][1].name, 'name1');" +
      "assert.deepEquel(response.result[0][1].content, 'content1');",
  });
  map.set(idCounter++, {
    method: "updateEntry",
    params: { id: 1, name: "name1_modified", content: "content1_modified" },
  });
  map.set(idCounter++, {
    method: "listEntries",
    test:
      "assert.deepEqual(response.result[0][1].name, 'name1_modified');" +
      "assert.deepEqual(response.result[0][1].content, 'content1_modified');",
  });
  map.set(idCounter++, { method: "deleteEntry", params: { id: 2 } });
  map.set(idCounter++, {
    method: "listEntries",
    test: "assert.notEqual(response.result[1][0], 2);",
  });
  map.set(idCounter++, {
    method: "updateEntry",
    params: { id: 3, name: "only_name3_modified" },
  });
  map.set(idCounter++, {
    method: "updateEntry",
    params: { id: 1, content: "only_content1_modified" },
  });
  map.set(idCounter++, {
    method: "listEntries",
    test:
      "assert.deepEqual(response.result[1][1].name, 'only_name3_modified');" +
      "assert.deepEqual(response.result[1][1].content, 'content3_modified');" +
      "assert.deepEqual(response.result[0][1].name, 'name1_modified');" +
      "assert.deepEqual(response.result[0][1].content, 'only_content1_modified');",
  });

  for (var [key, value] of map) {
    console.log("\n>>> method: " + value.method);
    const response = parse(
      await hrp
        .post("http://localhost:3000/api/", {
          body: format.request(0, value.method, value.params),
        })
        .readAll("utf-8")
    );

    if (response.type === "response") {
      console.log(response.result);
    } else if (response.type === "error") {
      console.error(response.error);
    }

    if (value.test !== undefined) {
      console.log("\n>>> test: " + value.test);
      new Function("return" + value.test);
    }
  }
}
main().catch(console.error.bind(console, "FATAL : "));
