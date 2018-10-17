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
  const n = process.argv[2];
  const LISTTESTCASE = [
    [
      /* TestCase OK */
      ["deleteEntries",""],
      ["listEntries","assert.deepEqual(response.result, [])"],
      ["createEntry --name name1 --content content1", ""],
      ["createEntry --name name2 --content content2", ""],
      ["createEntry --name name3 --content content3", ""],
      ["listEntries", "assert.deepEqual(response.result[0][1].name, 'name1');" +
        " assert.deepEqual(response.result[0][1].content, 'content1');" + 
        " assert.deepEqual(response.result[0][1].id, 1);"],
      ["updateEntry --id 1 --name name1_modified --content content1_modified",""],
      ["listEntries", "assert.deepEqual(response.result[0][1].name, 'name1_modified');" +
        " assert.deepEqual(response.result[0][1].content, 'content1_modified');"],
      ["deleteEntry --id 2", ""],
      ["listEntries", "assert.notEqual(response.result[1][0], 2);" ],
      ["updateEntry --id 3 --name name3_modified", ""],
      ["listEntries", "assert.deepEqual(response.result[1][1].name, 'name3_modified');" +
        " assert.deepEqual(response.result[1][1].content, 'content3')"]
    ]
  ];

  const TESTCASE = LISTTESTCASE[n];

  for (var i = 0; i < TESTCASE.length; i++) {
    const params = require("minimist")(TESTCASE[i][0].split(" "));
    const method = params._[0];
    console.log("\n>>> " + TESTCASE[i][0]);
    
    const response = parse(
      await hrp
        .post("http://localhost:3000/api/", {
          body: format.request(0, method, params),
        })
        .readAll("utf-8")
    );
      
    if (response.type === "response") {
      console.log(response.result);
    } else if (response.type === "error") {
      console.error(response.error);
    }
    
    if (TESTCASE[i][1] !== "") {
      console.log("\n>>> " + TESTCASE[i][1]);
      eval(TESTCASE[i][1]);
    }
  }
}
main().catch(console.error.bind(console, "FATAL : "));
