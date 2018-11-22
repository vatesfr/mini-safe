/* eslint-env node, jest */

const hrp = require("http-request-plus").default;
const jrp = require("json-rpc-protocol");
const keyBy = require("lodash/keyBy");

const websocket = new WebSocket("ws://localhost:4000");

async function call(method, params) {
  return jrp.parse.result(
    await hrp
      .post("http://localhost:4000/api/", {
        body: jrp.format.request(0, method, params),
      })
      .readAll("utf-8")
  );
}

// swap promise fulfilment/rejection, very handy to test rejections
const invertPromise = p =>
  p.then(
    value => {
      throw value;
    },
    reason => reason
  );

function compareTimestamps(ts1, ts2) {
  return expect(Math.abs(ts1 - ts2)).toBeLessThan(1e2);
}

let entries, id1, id2, id3, message;

beforeAll(() => {
  websocket.onmessage = event => {
    message = jrp.parse(event.data);
  };
});

afterAll(() => {
  websocket.close();
});

test("create entry", async () => {
  id1 = await call("createEntry", { name: "name1", content: "content1" });
  expect(message.type).toEqual("notification");
  expect(message.method).toEqual("createEntry");
  expect(message.params.entry).toEqual({
    id: id1,
    name: "name1",
    content: "content1",
    created: expect.any(Number),
    updated: expect.any(Number),
  });

  id2 = await call("createEntry", { content: "content2" });
  expect(message.type).toEqual("notification");
  expect(message.method).toEqual("createEntry");
  expect(message.params.entry).toEqual({
    id: id2,
    content: "content2",
    created: expect.any(Number),
    updated: expect.any(Number),
  });

  id3 = await call("createEntry", { name: "name3" });
  expect(message.type).toEqual("notification");
  expect(message.method).toEqual("createEntry");
  expect(message.params.entry).toEqual({
    id: id3,
    name: "name3",
    created: expect.any(Number),
    updated: expect.any(Number),
  });

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

  entries = keyBy(response, "id");

  response.forEach(function(entry) {
    expect(entry.created).toBe(entry.updated);
    compareTimestamps(entry.created, now);
  });
});

test("update entry", async () => {
  await call("updateEntry", {
    id: id1,
    name: "name1_modified",
    content: "content1_modified",
  });
  expect(message.type).toEqual("notification");
  expect(message.method).toEqual("updateEntry");
  expect(message.params.entry).toEqual({
    id: id1,
    name: "name1_modified",
    content: "content1_modified",
    created: expect.any(Number),
    updated: expect.any(Number),
  });

  await call("updateEntry", { id: id2, name: "only_name2_modified" });
  expect(message.type).toEqual("notification");
  expect(message.method).toEqual("updateEntry");
  expect(message.params.entry).toEqual({
    id: id2,
    name: "only_name2_modified",
    content: "content2",
    created: expect.any(Number),
    updated: expect.any(Number),
  });

  await call("updateEntry", {
    id: id3,
    content: "only_content3_modified",
  });
  expect(message.type).toEqual("notification");
  expect(message.method).toEqual("updateEntry");
  expect(message.params.entry).toEqual({
    id: id3,
    name: "name3",
    content: "only_content3_modified",
    created: expect.any(Number),
    updated: expect.any(Number),
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

  response.forEach(function(entry) {
    expect(entry.created).toBe(entries[entry.id].created);
    compareTimestamps(entry.updated, now);
  });
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
  expect(message.type).toEqual("notification");
  expect(message.method).toEqual("deleteEntry");
  expect(message.params.id).toEqual(id1);

  await call("deleteEntry", { id: id2 });
  expect(message.type).toEqual("notification");
  expect(message.method).toEqual("deleteEntry");
  expect(message.params.id).toEqual(id2);

  await call("deleteEntry", { id: id3 });
  expect(message.type).toEqual("notification");
  expect(message.method).toEqual("deleteEntry");
  expect(message.params.id).toEqual(id3);

  const entries = keyBy(await call("listEntries"), "id");

  expect(id1 in entries).toBe(false);
  expect(id2 in entries).toBe(false);
  expect(id3 in entries).toBe(false);
});
