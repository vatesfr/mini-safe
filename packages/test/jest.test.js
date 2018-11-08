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

const invertPromise = p =>
  p.then(
    value => {
      throw value;
    },
    reason => reason
  );

test("create entry", async () => {
  expect(
    await call("createEntry", { name: "name1", content: "content1" })
  ).toBe(1);
  expect(await call("createEntry", { content: "content2" })).toBe(2);
  expect(await call("createEntry", { name: "name3" })).toBe(3);

  const response = await call("listEntries");

  expect(response).toEqual([
    {
      id: 1,
      name: "name1",
      content: "content1",
      created: expect.any(Number),
      updated: expect.any(Number),
    },
    {
      id: 2,
      content: "content2",
      created: expect.any(Number),
      updated: expect.any(Number),
    },
    {
      id: 3,
      name: "name3",
      created: expect.any(Number),
      updated: expect.any(Number),
    },
  ]);
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

  expect(response).toEqual([
    {
      id: 1,
      name: "name1_modified",
      content: "content1_modified",
      created: expect.any(Number),
      updated: expect.any(Number),
    },
    {
      id: 2,
      name: "only_name2_modified",
      content: "content2",
      created: expect.any(Number),
      updated: expect.any(Number),
    },
    {
      id: 3,
      name: "name3",
      content: "only_content3_modified",
      created: expect.any(Number),
      updated: expect.any(Number),
    },
  ]);
});

test("delete entry", async () => {
  await call("deleteEntry", { id: 2 });

  const response = await call("listEntries");

  expect(response[1].id).not.toBe(2);
});

test("Error on delete: could not find id 0", async () => {
  expect(
    await invertPromise(
      call("deleteEntry", {
        id: 0,
      })
    )
  ).toMatchSnapshot();
});

test("Error on update: could not find id 0", async () => {
  expect(
    await invertPromise(
      call("updateEntry", {
        id: 0,
        name: "name0",
        content: "content0",
      })
    )
  ).toMatchSnapshot();
});

test("Error on update: name or content expected", async () => {
  expect(
    await invertPromise(
      call("updateEntry", {
        id: 1,
      })
    )
  ).toMatchSnapshot();
});

test("Error: method not found", async () => {
  expect(
    await invertPromise(
      call("inexistantMethod", {
        id: 0,
        name: "name0",
        content: "content0",
      })
    )
  ).toMatchSnapshot();
});
