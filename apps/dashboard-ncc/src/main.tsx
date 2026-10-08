import { createRoot } from "react-dom/client";
import App from "./App";
import "./env";
import "./index.css";
import "@tower-guard/ui/styles/futuristic.css";

createRoot(document.getElementById("root")!).render(<App />);
