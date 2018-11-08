/* eslint-env node, jest */

const hrp = require("http-request-plus").default;
const jrp = require("json-rpc-protocol");
const _ = require("lodash");

async function call(method, params) {
  return jrp.parse.result(
    await hrp
      .post("http://localhost:4000/api/", {
        body: jrp.format.request(0, method, params),
      })
      .readAll("utf-8")
  );
}

/* Jest doesn't handle correctly when the value is not an error */

const invertPromise = p =>
  p.then(
    value => {
      throw value;
    },
    reason => reason
  );

function compareTimestamps(ts1, ts2) {
  return Math.abs(ts1 - ts2) < 1e2;
}

let entries, id1, id2, id3;

test("create entry", async () => {
  id1 = await call("createEntry", { name: "name1", content: "content1" });
  id2 = await call("createEntry", { content: "content2" });
  id3 = await call("createEntry", { name: "name3" });

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

  entries = _.keyBy(response, "id");

  expect(entries[id1].created).toBe(entries[id1].updated);
  expect(entries[id2].created).toBe(entries[id2].updated);
  expect(entries[id3].created).toBe(entries[id3].updated);
  expect(compareTimestamps(entries[id1].created, now)).toBe(true);
  expect(compareTimestamps(entries[id2].created, now)).toBe(true);
  expect(compareTimestamps(entries[id3].created, now)).toBe(true);
});

test("update entry", async () => {
  await call("updateEntry", {
    id: id1,
    name: "name1_modified",
    content: "content1_modified",
  });
  await call("updateEntry", { id: id2, name: "only_name2_modified" });
  await call("updateEntry", {
    id: id3,
    content: "only_content3_modified",
  });

  const now = Date.now();
  const response = await call("listEntries");

  expect(response).toEqual([
    {
      id: id1,
      name: "name1_modified",
      content: "content1_modified",
      created: expect.any(Number),
      updated: expect.any(Number),
    },
    {
      id: id2,
      name: "only_name2_modified",
      content: "content2",
      created: expect.any(Number),
      updated: expect.any(Number),
    },
    {
      id: id3,
      name: "name3",
      content: "only_content3_modified",
      created: expect.any(Number),
      updated: expect.any(Number),
    },
  ]);

  const entriesUpdated = _.keyBy(response, "id");

  expect(entriesUpdated[id1].created).toBe(entries[id1].created);
  expect(entriesUpdated[id2].created).toBe(entries[id2].created);
  expect(entriesUpdated[id3].created).toBe(entries[id3].created);
  expect(compareTimestamps(entriesUpdated[id1].updated, now)).toBe(true);
  expect(compareTimestamps(entriesUpdated[id2].updated, now)).toBe(true);
  expect(compareTimestamps(entriesUpdated[id3].updated, now)).toBe(true);
});

test("Error on delete: could not find id", async () => {
  expect(
    await invertPromise(
      call("deleteEntry", {
        id: "0",
      })
    )
  ).toMatchSnapshot();
});

test("Error on update: could not find id", async () => {
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

test("delete entry", async () => {
  await call("deleteEntry", { id: id1 });
  await call("deleteEntry", { id: id2 });
  await call("deleteEntry", { id: id3 });

  const response = await call("listEntries");

  expect(response.includes(entry => entry.id === id1)).toBe(false);
  expect(response.includes(entry => entry.id === id2)).toBe(false);
  expect(response.includes(entry => entry.id === id3)).toBe(false);
});
