import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { reportWebVitals } from "./utils/webVitals";

createRoot(document.getElementById("root")!).render(<App />);

// Report Web Vitals in production
if (import.meta.env.PROD) {
  reportWebVitals((metric) => {
    if (metric.rating === "poor") {
      console.warn(`⚠️ Poor ${metric.name}: ${metric.value.toFixed(2)}${metric.name === "CLS" ? "ms" : ""}`);
    }
  });
}
