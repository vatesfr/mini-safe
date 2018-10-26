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
    entries: [],
    name: "",
    content: "",
    id: "",
  }),
  effects: {
    async initialize() {
      await this.effects.refreshEntries();
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
        await this.effects.refreshEntries();
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
        await this.effects.refreshEntries();
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
  },
})(injectState(App));
