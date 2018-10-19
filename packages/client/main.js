/* eslint-disable no-console */

import hrp from "http-request-plus";
import {
  format,
  parse,
  InvalidParameters,
  MethodNotFound,
} from "json-rpc-protocol";
import assert from "assert";

async function main() {
  var TESTCASE = [
    ["createEntry", { name: "name1", content: "content1" }],
    ["createEntry", { name: "name2", content: "content2" }],
    ["createEntry", { name: "name3", content: "content3" }],
    [
      "listEntries",
      {},
      function(response) {
        assert.strictEqual(response.result[0][1].name, "name1");
        assert.strictEqual(response.result[0][1].content, "content1");
        assert.strictEqual(response.result[1][1].name, "name2");
        assert.strictEqual(response.result[1][1].content, "content2");
        assert.strictEqual(response.result[2][1].name, "name3");
        assert.strictEqual(response.result[2][1].content, "content3");
      },
    ],
    [
      "updateEntry",
      { id: 1, name: "name1_modified", content: "content1_modified" },
    ],
    [
      "listEntries",
      {},
      function(response) {
        assert.strictEqual(response.result[0][1].name, "name1_modified");
        assert.strictEqual(response.result[0][1].content, "content1_modified");
      },
    ],
    ["deleteEntry", { id: 2 }],
    [
      "listEntries",
      {},
      function(response) {
        assert.notStrictEqual(response.result[1][0], 2);
      },
    ],
    ["updateEntry", { id: 3, name: "only_name3_modified" }],
    ["updateEntry", { id: 1, content: "only_content1_modified" }],
    [
      "listEntries",
      {},
      function(response) {
        assert.strictEqual(response.result[1][1].name, "only_name3_modified");
        assert.strictEqual(response.result[1][1].content, "content3");
        assert.strictEqual(response.result[0][1].name, "name1_modified");
        assert.strictEqual(
          response.result[0][1].content,
          "only_content1_modified"
        );
      },
    ],
    [
      /* Error: could not find entry 0 */
      "deleteEntry",
      { id: 0 },
      function(response) {
        assert.strictEqual(response.type, "error");
        assert.strictEqual(
          response.error.message,
          new InvalidParameters().message
        );
      },
    ],
    [
      /* Error: name or content expected */
      "updateEntry",
      { id: 1 },
      function(response) {
        assert.strictEqual(response.type, "error");
        assert.strictEqual(
          response.error.message,
          new InvalidParameters().message
        );
      },
    ],
    [
      /* Error: could not find entry 0 */
      "updateEntry",
      { id: 0, name: "name0", content: "content0" },
      function(response) {
        assert.strictEqual(response.type, "error");
        assert.strictEqual(
          response.error.message,
          new InvalidParameters().message
        );
      },
    ],
    [
      /* Error: method not found */
      "inexistantMethod",
      {},
      function(response) {
        assert.strictEqual(response.type, "error");
        assert.strictEqual(
          response.error.message,
          new MethodNotFound("inexistantMethod").message
        );
      },
    ],
    [
      "listEntries",
      {},
      function(response) {
        assert.strictEqual(response.result[1][1].name, "only_name3_modified");
        assert.strictEqual(response.result[1][1].content, "content3");
        assert.strictEqual(response.result[0][1].name, "name1_modified");
        assert.strictEqual(
          response.result[0][1].content,
          "only_content1_modified"
        );
      },
    ],
  ];

  for (var i = 0; i < TESTCASE.length; i++) {
    console.log("\n>>> method: " + TESTCASE[i][0]);
    const response = parse(
      await hrp
        .post("http://localhost:3000/api/", {
          body: format.request(0, TESTCASE[i][0], TESTCASE[i][1]),
        })
        .readAll("utf-8")
    );

    if (response.type === "response") {
      console.log(response.result);
    } else if (response.type === "error") {
      console.error(response.error);
    }

    if (TESTCASE[i][2] !== undefined) {
      console.log("\n>>> test: " + TESTCASE[i][2]);
      TESTCASE[i][2](response);
    }
  }
}
main().catch(console.error.bind(console, "FATAL : "));
