import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Initialize i18n - must be imported before App
import "./lib/i18n";

// Initialize Sentry error tracking
import { initSentry } from "./lib/sentry";
initSentry();

// Initialize analytics
import { initAnalytics } from "./lib/analytics";
initAnalytics();

// Register service worker for PWA
import { registerServiceWorker } from "./lib/registerServiceWorker";
registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
