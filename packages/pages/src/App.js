import React from "react";
import { provideState, injectState } from "reaclette";
import { format, parse } from "json-rpc-protocol";

const App = ({ effects, state }) => (
  <div>
    <div name="listEntries">
      <button type="button" onClick={effects.refreshEntries}>
        Refresh
      </button>
      <ul>
        {state.entries.map(entry => (
          <li key={entry.id}>
            {entry.id} {entry.name} {entry.content}
          </li>
        ))}
      </ul>
    </div>
    <div name="createEntry">
      <label>
        Name
        <input
          type="text"
          id="nameEntry"
          name="name"
          value={state.name}
          onChange={effects.changeName}
        />
      </label>
      <label>
        Content
        <input
          type="text"
          id="contentEntry"
          name="name"
          value={state.content}
          onChange={effects.changeContent}
        />
      </label>
      <button type="button" onClick={effects.createEntry}>
        Create
      </button>
    </div>
    <div name="deleteEntry">
      <label>
        Id
        <input
          type="text"
          id="idEntry"
          name="id"
          value={state.id}
          onChange={effects.changeId}
        />
        <button type="button" onClick={effects.deleteEntry}>
          Delete
        </button>
      </label>
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
    async deleteEntry() {
      await fetch("/api/", {
        method: "post",
        body: format.request(0, "deleteEntry", {
          id: this.state.id,
        }),
      });
      this.state.id = "";
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
    async changeId(
      _,
      {
        target: { value },
      }
    ) {
      this.state.id = value;
    },
  },
})(injectState(App));
