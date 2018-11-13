import {
  format,
  parse,
  JsonRpcError,
  InvalidRequest,
  InvalidParameters,
  MethodNotFound,
} from "json-rpc-protocol";
var WebSocketServer = require("ws").Server;
var ws = new WebSocketServer({ port: 4000 });
console.log("Server started...");

var entries = new Map();
let idCounter = 0;

function generateId() {
  return (idCounter += 1);
}

const METHODS = {
  createEntry({ name, content }) {
    const entry = {
      id: generateId(),
      name,
      content,
      created: Date.now(),
      updated: Date.now(),
    };

    entries.set(entry.id, entry);

    return entry.id;
  },

  listEntries() {
    return Array.from(entries.values());
  },

  deleteEntry({ id }) {
    if (!entries.delete(+id)) {
      throw new InvalidParameters(`could not find entry ${id}`);
    }
  },

  updateEntry({ id, name, content }) {
    if (name === undefined && content === undefined) {
      throw new InvalidParameters(
        `could not update entry ${id}, name or content expected`
      );
    }

    const entry = entries.get(+id);
    if (entry === undefined) {
      throw new InvalidParameters(`could not find entry ${id}`);
    }

    if (name !== undefined) {
      entry.name = name;
    }

    if (content !== undefined) {
      entry.content = content;
    }

    entry.updated = Date.now();
    entries.set(+id, entry);
  },
};

ws.on("connection", function(ws) {
  console.log("Connected");

  ws.on("message", async function(req) {
    try {
      const request = parse(req);
      if (request.type !== "request") {
        throw new InvalidRequest();
      }

      const method = METHODS[request.method];
      if (method === undefined) {
        throw new MethodNotFound(request.method);
      }

      const result = method(request.params);
      ws.send(
        format.response(request.id, result === undefined ? true : result)
      );
    } catch (err) {
      ws.send(
        format.error(0, new JsonRpcError(err.message, err.code, err.data))
      );
    }
  });
  ws.on("close", function() {
    console.log("Closed");
  });
});
