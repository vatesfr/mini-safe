import React from "react";
import { provideState, injectState } from "reaclette";
import { format, parse } from "json-rpc-protocol";

const App = ({ effects, state }) => (
  <div>
    {state.isEditting ? (
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
                value={entry.id}
                onClick={effects.updateEntry}
              >
                Update
              </button>
            </li>
          ))}
        </ul>
        <fieldset>
          <div name="createEntry">
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
            <button type="button" onClick={effects.createEntry}>
              Create
            </button>
          </div>
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
    isEditting: false,
  }),
  effects: {
    async refreshEntries() {
      const response = await fetch("/api/", {
        method: "post",
        body: format.request(0, "listEntries", {}),
      });
      this.state.entries = parse(await response.text()).result;
    },
    async createEntry() {
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
    async submitUpdates() {
      const response = await fetch("/api/", {
        method: "post",
        body: format.request(0, "updateEntry", {
          id: this.state.id,
          name: this.state.name,
          content: this.state.content,
        }),
      });
      this.state.name = "";
      this.state.content = "";
      const parsed = parse(await response.text());
      if (parsed.type === "error") {
        console.error(parsed.error);
      } else if (parsed.type === "response") {
        await this.effects.refreshEntries();
      }
      // this.state.isEditting = false;
    },
    async updateEntry(
      _,
      {
        target: { value },
      }
    ) {
      this.state.isEditting = true;
      this.state.id = value;
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
