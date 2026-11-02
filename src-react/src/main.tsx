import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Dev only: register messages from the browser console,
// e.g. chottuChat.getState().register({ role: "assistant", content: "hi" }).
if (import.meta.env.DEV) {
  import("@/store/chat").then(({ useChatStore }) => {
    Object.assign(window, { chottuChat: useChatStore });
  });
}
