/* eslint-env node, jest */

const hrp = require("http-request-plus").default;
const jrp = require("json-rpc-protocol");
const assert = require("assert");

async function call(method, params) {
  return jrp.parse(
    await hrp
      .post("http://localhost:4000/api/", {
        body: jrp.format.request(0, method, params),
      })
      .readAll("utf-8")
  );
}

test("createe entry", async () => {
  const id1 = await call("createEntry", { name: "name1", content: "content1" });
  const id2 = await call("createEntry", { content: "content2" });
  const id3 = await call("createEntry", { name: "name3" });

  assert.strictEqual(id1.result, 1);
  assert.strictEqual(id2.result, 2);
  assert.strictEqual(id3.result, 3);

  const response = await call("listEntries");

  assert.strictEqual(response.result[0].name, "name1");
  assert.strictEqual(response.result[0].content, "content1");
  assert.strictEqual(response.result[1].content, "content2");
  assert.strictEqual(response.result[2].name, "name3");
});

test("update entry", async () => {
  await call("updateEntry", {
    id: 1,
    name: "name1_modified",
    content: "content1_modified",
  });
  await call("updateEntry", { id: 2, name: "only_name2_modified" });
  await call("updateEntry", { id: 3, content: "only_content3_modified" });

  const response = await call("listEntries");

  assert.strictEqual(response.result[0].name, "name1_modified");
  assert.strictEqual(response.result[0].content, "content1_modified");
  assert.strictEqual(response.result[1].name, "only_name2_modified");
  assert.strictEqual(response.result[1].content, "content2");
  assert.strictEqual(response.result[2].name, "name3");
  assert.strictEqual(response.result[2].content, "only_content3_modified");
});

test("delete entry", async () => {
  await call("deleteEntry", { id: 2 });

  const response = await call("listEntries");

  assert.notStrictEqual(response.result[1], 2);
});

test("Error on delete: could not find id 0", async () => {
  const response = await call("deleteEntry", { id: 0 });

  assert.strictEqual(response.type, "error");
  assert.strictEqual(
    response.error.message,
    new jrp.InvalidParameters().message
  );
});

test("Error on update: could not find id 0", async () => {
  const response = await call("updateEntry", {
    id: 0,
    name: "name0",
    content: "content0",
  });

  assert.strictEqual(response.type, "error");
  assert.strictEqual(
    response.error.message,
    new jrp.InvalidParameters().message
  );
});

test("Error on update: name or content expected", async () => {
  const response = await call("updateEntry", { id: 1 });

  assert.strictEqual(response.type, "error");
  assert.strictEqual(
    response.error.message,
    new jrp.InvalidParameters().message
  );
});

test("Error: method not found", async () => {
  const response = await call("inexistantMethod");

  assert.strictEqual(response.type, "error");
  assert.strictEqual(
    response.error.message,
    new jrp.MethodNotFound("inexistantMethod").message
  );
});
