/* eslint-env jest */

const hrp = require("http-request-plus").default;
const jrp = require("json-rpc-protocol");

async function call(method, params) {
  return jrp.parse(
    await hrp
      .post("http://localhost:4000/api/", {
        body: jrp.format.request(0, method, params),
      })
      .readAll("utf-8")
  );
}

test("create entry", async () => {
  const id1 = await call("createEntry", { name: "name1", content: "content1" });
  expect(id1.result).toBe(1);

  const id2 = await call("createEntry", { content: "content2" });
  expect(id2.result).toBe(2);

  const id3 = await call("createEntry", { name: "name3" });
  expect(id3.result).toBe(3);

  const response = await call("listEntries");

  expect(response.result[0].name).toBe("name1");
  expect(response.result[0].content).toBe("content1");
  expect(response.result[1].content).toBe("content2");
  expect(response.result[2].name).toBe("name3");
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

  expect(response.result[0].name).toBe("name1_modified");
  expect(response.result[0].content).toBe("content1_modified");
  expect(response.result[1].name).toBe("only_name2_modified");
  expect(response.result[1].content).toBe("content2");
  expect(response.result[2].name).toBe("name3");
  expect(response.result[2].content).toBe("only_content3_modified");
});

test("delete entry", async () => {
  await call("deleteEntry", { id: 2 });

  const response = await call("listEntries");

  expect(response.result[1]).not.toBe(2);
});

test("Error on delete: could not find id 0", async () => {
  const response = await call("deleteEntry", { id: 0 });

  expect(response.type).toBe("error");
  expect(response.error.message).toBe(new jrp.InvalidParameters().message);
});

test("Error on update: could not find id 0", async () => {
  const response = await call("updateEntry", {
    id: 0,
    name: "name0",
    content: "content0",
  });

  expect(response.type).toBe("error");
  expect(response.error.message).toBe(new jrp.InvalidParameters().message);
});

test("Error on update: name or content expected", async () => {
  const response = await call("updateEntry", { id: 1 });

  expect(response.type).toBe("error");
  expect(response.error.message).toBe(new jrp.InvalidParameters().message);
});

test("Error: method not found", async () => {
  const response = await call("inexistantMethod");

  expect(response.type).toBe("error");
  expect(response.error.message).toBe(
    new jrp.MethodNotFound("inexistantMethod").message
  );
});
