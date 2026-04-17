import { createRoot } from "react-dom/client";
import App from "./App";
import "./env"; // validate env on boot
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
