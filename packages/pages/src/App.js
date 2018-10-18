import React from "react";
import { provideState, injectState } from "@julien-f/freactal";
import { format, parse } from "json-rpc-protocol";

const App = ({ effects, state }) => (
  <div>
    <button type="button" onClick={effects.refreshEntries}>
      Refresh
    </button>
    <ul>
      {state.entries.map(entry => <li key={entry.id}>{entry.name}</li>)}
    </ul>
  </div>
);

export default provideState({
  initialState: () => ({
    entries: [],
  }),
  effects: {
    async refreshEntries() {
      const response = await fetch("/api/", {
        method: "post",
        body: format.request(0, "listEntries", {}),
      });
      this.state.entries = parse(await response.text()).result;
    },
  },
})(injectState(App));
