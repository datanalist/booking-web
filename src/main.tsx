import { createRoot } from "react-dom/client";
import { applyOptionalLocalDevAuth } from "./app/applyOptionalLocalDevAuth";
import { App } from "./App";
import "./index.css";

applyOptionalLocalDevAuth(localStorage);
createRoot(document.getElementById("root")!).render(<App />);
