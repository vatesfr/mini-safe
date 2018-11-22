import React from "react";
import { provideState, injectState } from "reaclette";
import { format, parse } from "json-rpc-protocol";

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
    websocket: new WebSocket("ws://localhost:4000"),
    entries: [],
    name: "",
    content: "",
    id: "",
  }),
  effects: {
    async initialize() {
      const {
        effects: { refreshEntries },
        state,
      } = this;

      await refreshEntries();

      const { websocket } = state;
      websocket.onerror = function(event) {
        console.error(event);
      };
      websocket.onmessage = event => {
        const message = parse(event.data);
        if (message.type !== "notification") {
          return;
        }

        const { method, params } = message;
        if (method === "createEntry") {
          state.entries = [...state.entries, params.entry];
        } else if (method === "deleteEntry") {
          state.entries = state.entries.filter(entry => entry.id !== params.id);
        } else if (method === "updateEntry") {
          const { entry } = params;
          const { entries } = state;
          const i = entries.findIndex(candidate => candidate.id === entry.id);
          if (i === -1) {
            state.entries = [...entries, entry];
          } else {
            state.entries = [
              ...entries.slice(0, i),
              entry,
              ...entries.slice(i + 1),
            ];
          }
        } else {
          refreshEntries();
        }
      };
    },
    async refreshEntries() {
      const response = await fetch("/api/", {
        method: "post",
        body: format.request(0, "listEntries", {}),
      });
      this.state.entries = parse(await response.text()).result;
    },
    async deleteEntry(
      _,
      {
        target: { value },
      }
    ) {
      const response = await fetch("/api/", {
        method: "post",
        body: format.request(0, "deleteEntry", {
          id: value,
        }),
      });
      try {
        await parse.result(await response.text());
      } catch (error) {
        console.error(error);
      }
    },
    async submit(_, event) {
      event.preventDefault();

      const { state } = this;
      const { id, name, content } = state;
      const response = await fetch("/api/", {
        method: "post",
        body: format.request(0, id === "" ? "createEntry" : "updateEntry", {
          id: id === "" ? undefined : id,
          name,
          content,
        }),
      });
      try {
        await parse.result(await response.text());
        this.state.name = "";
        this.state.content = "";
        this.state.id = "";
      } catch (error) {
        console.error(error);
      }
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
    finalize() {
      this.state.websocket.close();
    },
  },
})(injectState(App));
