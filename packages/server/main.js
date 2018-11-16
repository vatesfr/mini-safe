import {
  format,
  parse,
  JsonRpcError,
  InvalidRequest,
  InvalidParameters,
  MethodNotFound,
} from "json-rpc-protocol";
var WebSocketServer = require("ws").Server;
var wss = new WebSocketServer({ port: 4000 });

var clients = new Set();
var entries = new Map();
let idCounter = 0;

function generateId() {
  return String((idCounter += 1));
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
    if (!entries.delete(id)) {
      throw new InvalidParameters(`could not find entry ${id}`);
    }
  },

  updateEntry({ id, name, content }) {
    if (name === undefined && content === undefined) {
      throw new InvalidParameters(
        `could not update entry ${id}, name or content expected`
      );
    }

    const entry = entries.get(id);
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
    entries.set(id, entry);
  },
};

wss.on("connection", function(wss) {
  clients.add(wss);

  wss.on("message", async function(req) {
    try {
      const request = parse(req);
      if (request.type !== "request") {
        throw new InvalidRequest();
      }

      const method = METHODS[request.method];
      if (method === undefined) {
        throw new MethodNotFound(request.method);
      }

      var result = method(request.params);
      wss.send(
        format.response(request.id, result === undefined ? true : result)
      );

      if (request.method !== "listEntries") {
        result = METHODS.listEntries();
        clients.forEach(function(client) {
          if (client !== wss) {
            client.send(format.response(request.id, result));
          }
        });
      }
    } catch (err) {
      wss.send(
        format.error(0, new JsonRpcError(err.message, err.code, err.data))
      );
    }
  });

  wss.on("close", function() {
    clients.forEach(function(client) {
      if (client === wss) {
        clients.delete(client);
      }
    });
  });
});
