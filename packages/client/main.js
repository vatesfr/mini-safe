/* eslint-disable no-console */

import hrp from "http-request-plus";
import { format, parse } from "json-rpc-protocol";

async function main() {
  const n = process.argv[2];
  const LISTTESTCASE = [
    [
      /* TestCase OK */
      "deleteEntries",
      "listEntries",
      "createEntry --name name1 --content content1",
      "createEntry --name name2 --content content2",
      "createEntry --name name3 --content content3",
      "listEntries",
      "updateEntry --id 1 --name name1_modified --content content1_modified",
      "listEntries",
      "deleteEntry --id 2",
      "listEntries",
      "updateEntry --id 3 --name name3_modified",
      "listEntries",
      "createEntry --name name4 --content content4",
      "listEntries",
      "updateEntry --id 4 --content content4_modified",
      "listEntries",
    ],
    [
      /* Error : id doesn't exist for delete */
      "listEntries",
      "createEntry --name name1 --content content1",
      "createEntry --name name2 --content content2",
      "listEntries",
      "deleteEntry --id 0",
      "listEntries",
    ],
    [
      /* Error : name or content expected for update */
      "listEntries",
      "createEntry --name name1 --content content1",
      "createEntry --name name2 --content content2",
      "listEntries",
      "updateEntry --id 1",
      "listEntries",
    ],
    [
      /* Error : id doesn't exist for update */
      "listEntries",
      "createEntry --name name1 --content content1",
      "listEntries",
      "updateEntry --id 0 --name name4_mod --content content4_mod",
      "listEntries",
    ],
    [
      /* Error : method doesn't exist */
      "listEntries",
      "inexistantMethod",
      "listEntries",
    ],
  ];

  const TESTCASE = LISTTESTCASE[n];

  for (var i = 0; i < TESTCASE.length; i++) {
    const params = require("minimist")(TESTCASE[i].split(" "));
    const method = params._[0];
    console.log("\n>>> " + TESTCASE[i]);

    const response = parse(
      await hrp
        .post("http://localhost:3000/api/", {
          body: format.request(0, method, params),
        })
        .readAll("utf-8")
    );

    console.log(response.result);
  }
}
main().catch(console.error.bind(console, "FATAL : "));
