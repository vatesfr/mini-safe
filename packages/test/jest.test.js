/* eslint-env nodes, jest */

const hrp = require("http-request-plus").default;
const jrp = require("json-rpc-protocol");

async function call(method, params) {
  return jrp.parse.result(
    await hrp
      .post("http://localhost:4000/api/", {
        body: jrp.format.request(0, method, params),
      })
      .readAll("utf-8")
  );
}

test("create entry", async () => {
  expect(
    await call("createEntry", { name: "name1", content: "content1" })
  ).toBe(1);
  expect(await call("createEntry", { content: "content2" })).toBe(2);
  expect(await call("createEntry", { name: "name3" })).toBe(3);

  const response = await call("listEntries");

  expect(response[0].name).toEqual("name1");
  expect(response[0].content).toEqual("content1");
  expect(response[1].content).toEqual("content2");
  expect(response[2].name).toEqual("name3");
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

  expect(response[0].name).toEqual("name1_modified");
  expect(response[0].content).toEqual("content1_modified");
  expect(response[1].name).toEqual("only_name2_modified");
  expect(response[1].content).toEqual("content2");
  expect(response[2].name).toEqual("name3");
  expect(response[2].content).toEqual("only_content3_modified");
});

test("delete entry", async () => {
  await call("deleteEntry", { id: 2 });

  const response = await call("listEntries");

  expect(response[1].id).not.toBe(2);
});

test("Error on delete: could not find id 0", async () => {
  expect(() => call("deleteEntry", { id: 0 })).toThrow(jrp.InvalidParameters);
});

test("Error on update: could not find id 0", async () => {
  expect(async () =>
    call("updateEntry", {
      id: 0,
      name: "name0",
      content: "content0",
    })
  ).toThrowError(new jrp.InvalidParameters(`could not find id 0`));
});

// test("Error on update: name or content expected", async () => {
//   const response = await call("updateEntry", { id: 1 });

//   expect(response).toThrowError(jrp.InvalidParameters);
//   expect(response.message).toThrow(new jrp.InvalidParameters().message);
// });

// test("Error: method not found", async () => {
//   const response = await call("inexistantMethod");

//   expect(response).toThrow();
//   expect(response.message).toThrow(
//     new jrp.MethodNotFound("inexistantMethod").message
//   );
// });
