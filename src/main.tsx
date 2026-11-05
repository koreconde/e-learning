import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { captureAdsAttribution } from "./lib/ads-attribution";

captureAdsAttribution();

const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
