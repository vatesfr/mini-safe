import React from "react";
import { provideState, injectState } from "reaclette";
import { format, parse } from "json-rpc-protocol";

const App = ({ effects, state }) => (
  <div>
    {state.id !== "" ? (
      <form onSubmit={effects.submitUpdates}>
        <label>
          <input type="text" value={state.name} onChange={effects.changeName} />
        </label>
        <label>
          <input
            type="text"
            value={state.content}
            onChange={effects.changeContent}
          />
        </label>
        <input type="submit" value="Submit" />
      </form>
    ) : (
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
        <fieldset>
          <form onSubmit={effects.createEntry}>
            <label>
              Name
              <input
                type="text"
                value={state.name}
                onChange={effects.changeName}
              />
            </label>
            <label>
              Content
              <input
                type="text"
                value={state.content}
                onChange={effects.changeContent}
              />
            </label>
            <button type="submit" value="Submit">
              Create
            </button>
          </form>
        </fieldset>
      </div>
    )}
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
    async refreshEntries() {
      const response = await fetch("/api/", {
        method: "post",
        body: format.request(0, "listEntries", {}),
      });
      this.state.entries = parse(await response.text()).result;
    },
    async createEntry(effects, event) {
      event.preventDefault();
      await fetch("/api/", {
        method: "post",
        body: format.request(0, "createEntry", {
          name: this.state.name,
          content: this.state.content,
        }),
      });
      this.state.name = "";
      this.state.content = "";
      await this.effects.refreshEntries();
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
      const parsed = parse(await response.text());
      if (parsed.type === "error") {
        console.error(parsed.error);
      } else if (parsed.type === "response") {
        await this.effects.refreshEntries();
      }
    },
    async submitUpdates(effects, event) {
      event.preventDefault();
      const response = await fetch("/api/", {
        method: "post",
        body: format.request(0, "updateEntry", {
          id: this.state.id,
          name: this.state.name,
          content: this.state.content,
        }),
      });
      const parsed = parse(await response.text());
      if (parsed.type === "error") {
        console.error(parsed.error);
      } else if (parsed.type === "response") {
        this.state.name = "";
        this.state.content = "";
        this.state.id = "";
        await this.effects.refreshEntries();
      }
    },
    async updateEntry(_, event) {
      this.state.id = event.target.getAttribute("data-id");
      this.state.name = event.target.getAttribute("data-name");
      this.state.content = event.target.getAttribute("data-content");
    },
    async changeName(
      _,
      {
        target: { value },
      }
    ) {
      this.state.name = value;
    },
    async changeContent(
      _,
      {
        target: { value },
      }
    ) {
      this.state.content = value;
    },
  },
})(injectState(App));
