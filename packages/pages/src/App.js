import React from "react";
import { provideState, injectState } from "reaclette";
import { format, parse } from "json-rpc-protocol";

var websocket = new WebSocket("ws://localhost:4000");
console.log("Connection...");

const App = ({ effects, state }) => (
  <div>
    <div>
      <button type="button" onClick={effects.refreshEntries}>
        Refresh
      </button>
      <ul>
        {state.entries.map(entry => (
          <li key={entry.id}>
            {entry.name} {entry.content}
            <button
              type="button"
              value={entry.id}
              onClick={effects.deleteEntry}
            >
              Delete
            </button>
            <button
              type="button"
              data-id={entry.id}
              data-name={entry.name}
              data-content={entry.content}
              onClick={effects.updateEntry}
            >
              Update
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={effects.submit} onReset={effects.reset}>
        <label>
          Name
          <input type="text" value={state.name} onChange={effects.changeName} />
        </label>
        <label>
          Content
          <input
            type="text"
            value={state.content}
            onChange={effects.changeContent}
          />
        </label>
        <button type="submit">{state.id !== "" ? "Update" : "Create"}</button>
        <button type="reset">Cancel</button>
      </form>
    </div>
  </div>
);

export default provideState({
  initialState: () => ({
    entries: [],
    name: "",
    content: "",
    id: "",
  }),
  effects: {
    initialize() {
      const t = this;
      websocket.onopen = async function(evt) {
        console.log("Connected to the server");
        await t.effects.refreshEntries();
      };
      websocket.onerror = function(evt) {
        console.log(evt);
      };
    },
    refreshEntries() {
      var ts = this.state;

      websocket.send(format.request(0, "listEntries", {}));
      websocket.onmessage = async function(event) {
        ts.entries = await parse(event.data).result;
      };
    },
    deleteEntry(
      _,
      {
        target: { value },
      }
    ) {
      const t = this;
      websocket.send(
        format.request(0, "deleteEntry", {
          id: value,
        })
      );
      websocket.onmessage = async function(evt) {
        try {
          await parse.result(await evt.data);
          await t.effects.refreshEntries();
        } catch (error) {
          console.error(error);
        }
      };
    },
    submit(_, event) {
      event.preventDefault();
      const { state } = this;
      const { id, name, content } = state;
      var t = this;
      websocket.send(
        format.request(0, id === "" ? "createEntry" : "updateEntry", {
          id: id === "" ? undefined : id,
          name,
          content,
        })
      );
      websocket.onmessage = async function(evt) {
        try {
          await parse.result(await evt.data);
          t.state.name = "";
          t.state.content = "";
          t.state.id = "";
          await t.effects.refreshEntries();
        } catch (error) {
          console.error(error);
        }
      };
    },
    updateEntry(_, event) {
      Object.assign(this.state, event.target.dataset);
    },
    reset() {
      this.state.name = "";
      this.state.content = "";
      this.state.id = "";
    },
    changeName(
      _,
      {
        target: { value },
      }
    ) {
      this.state.name = value;
    },
    changeContent(
      _,
      {
        target: { value },
      }
    ) {
      this.state.content = value;
    },
  },
})(injectState(App));
