/* eslint-env node, jest */

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

/* if promise fulfilled, it throws value,
 * else, return reason */
const invertPromise = p =>
  p.then(
    value => {
      throw value;
    },
    reason => reason
  );

let entry1, entry2, entry3;

test("create entry", async () => {
  const id1 = await call("createEntry", { name: "name1", content: "content1" });
  const id2 = await call("createEntry", { content: "content2" });
  const id3 = await call("createEntry", { name: "name3" });

  const now = Date.now();
  const response = await call("listEntries");

  expect(response).toEqual([
    {
      id: id1,
      name: "name1",
      content: "content1",
      created: expect.any(Number),
      updated: expect.any(Number),
    },
    {
      id: id2,
      content: "content2",
      created: expect.any(Number),
      updated: expect.any(Number),
    },
    {
      id: id3,
      name: "name3",
      created: expect.any(Number),
      updated: expect.any(Number),
    },
  ]);

  entry1 = response.find(entry => entry.id === id1);
  entry2 = response.find(entry => entry.id === id2);
  entry3 = response.find(entry => entry.id === id3);

  expect(entry1.created).toBe(entry1.updated);
  expect(entry2.created).toBe(entry2.updated);
  expect(entry3.created).toBe(entry3.updated);
  expect(Math.abs(entry1.created - now)).toBeLessThan(1e2);
  expect(Math.abs(entry2.created - now)).toBeLessThan(1e2);
  expect(Math.abs(entry3.created - now)).toBeLessThan(1e2);
});

test("update entry", async () => {
  await call("updateEntry", {
    id: entry1.id,
    name: "name1_modified",
    content: "content1_modified",
  });
  await call("updateEntry", { id: entry2.id, name: "only_name2_modified" });
  await call("updateEntry", {
    id: entry3.id,
    content: "only_content3_modified",
  });

  const now = Date.now();
  const response = await call("listEntries");

  expect(response).toEqual([
    {
      id: entry1.id,
      name: "name1_modified",
      content: "content1_modified",
      created: expect.any(Number),
      updated: expect.any(Number),
    },
    {
      id: entry2.id,
      name: "only_name2_modified",
      content: "content2",
      created: expect.any(Number),
      updated: expect.any(Number),
    },
    {
      id: entry3.id,
      name: "name3",
      content: "only_content3_modified",
      created: expect.any(Number),
      updated: expect.any(Number),
    },
  ]);

  expect(response.find(entry => entry.id === entry1.id).created).toBe(
    entry1.created
  );
  expect(response.find(entry => entry.id === entry2.id).created).toBe(
    entry2.created
  );
  expect(response.find(entry => entry.id === entry3.id).created).toBe(
    entry3.created
  );
  expect(
    Math.abs(response.find(entry => entry.id === entry1.id).updated - now)
  ).toBeLessThan(1e2);
  expect(
    Math.abs(response.find(entry => entry.id === entry2.id).updated - now)
  ).toBeLessThan(1e2);
  expect(
    Math.abs(response.find(entry => entry.id === entry3.id).updated - now)
  ).toBeLessThan(1e2);
});

test("delete entry", async () => {
  await call("deleteEntry", { id: entry2.id });

  const response = await call("listEntries");

  expect(response.includes(entry => entry.id === entry2.id)).toBe(false);
});

test("Error on delete: could not find id 0", async () => {
  expect(
    await invertPromise(
      call("deleteEntry", {
        id: "0",
      })
    )
  ).toMatchSnapshot();
});

test("Error on update: could not find id 0", async () => {
  expect(
    await invertPromise(
      call("updateEntry", {
        id: "0",
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
        id: "1",
      })
    )
  ).toMatchSnapshot();
});

test("Error: method not found", async () => {
  expect(
    await invertPromise(
      call("inexistantMethod", {
        id: "0",
        name: "name0",
        content: "content0",
      })
    )
  ).toMatchSnapshot();
});
