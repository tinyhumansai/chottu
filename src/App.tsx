import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { platform, arch } from "@tauri-apps/plugin-os";
import { load } from "@tauri-apps/plugin-store";
import { open } from "@tauri-apps/plugin-dialog";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { info } from "@tauri-apps/plugin-log";
import "./App.css";

function App() {
  const [name, setName] = useState("");
  const [greeting, setGreeting] = useState("");
  const [launches, setLaunches] = useState<number>();
  const [env, setEnv] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    (async () => {
      setEnv(`v${await getVersion()} · ${platform()} / ${arch()}`);

      const store = await load("settings.json");
      const count = ((await store.get<number>("launches")) ?? 0) + 1;
      await store.set("launches", count);
      setLaunches(count);
      info(`launch #${count}`);
    })();

    const unlisten = onOpenUrl((urls) => setStatus(`Opened via ${urls.join(", ")}`));
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  async function greet() {
    setGreeting(await invoke<string>("greet", { name }));
  }

  async function notify() {
    let granted = await isPermissionGranted();
    if (!granted) granted = (await requestPermission()) === "granted";
    if (granted) sendNotification({ title: "Chottu", body: "Hello from Tauri!" });
    setStatus(granted ? "Notification sent" : "Notification permission denied");
  }

  async function pickFile() {
    const file = await open({ multiple: false, directory: false });
    setStatus(file ? `Picked ${file}` : "No file picked");
  }

  async function copy() {
    await writeText(greeting || "Chottu");
    setStatus("Copied to clipboard");
  }

  return (
    <main className="container">
      <h1>Chottu</h1>
      <p className="muted">
        {env} · launch #{launches ?? "…"}
      </p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greeting}</p>

      <div className="row">
        <button onClick={notify}>Notify</button>
        <button onClick={pickFile}>Pick file</button>
        <button onClick={copy}>Copy</button>
      </div>
      <p className="muted">{status}</p>
    </main>
  );
}

export default App;
