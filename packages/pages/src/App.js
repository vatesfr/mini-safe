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
      const parsed = parse(await response.text());
      if (parsed.type === "error") {
        console.error(parsed.error);
      } else if (parsed.type === "response") {
        await this.effects.refreshEntries();
      }
    },
    async submit(_, event) {
      event.preventDefault();

      var bodyToSend = "";
      if (this.state.id === "") {
        bodyToSend = format.request(0, "createEntry", {
          name: this.state.name,
          content: this.state.content,
        });
      } else {
        bodyToSend = format.request(0, "updateEntry", {
          id: this.state.id,
          name: this.state.name,
          content: this.state.content,
        });
      }
      const response = await fetch("/api/", {
        method: "post",
        body: bodyToSend,
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
    updateEntry(_, event) {
      const { dataset } = event.target;

      this.state.id = dataset.id;
      this.state.name = dataset.name;
      this.state.content = dataset.content;
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
