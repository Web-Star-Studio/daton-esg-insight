import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { reportWebVitals } from "./utils/webVitals";

// Render app
createRoot(document.getElementById("root")!).render(<App />);

// Report Web Vitals in production
if (import.meta.env.PROD) {
  reportWebVitals((metric) => {
    // Log metrics - in production, send to analytics
    if (metric.rating === 'poor') {
      console.warn(`⚠️ Poor ${metric.name}: ${metric.value.toFixed(2)}${metric.name === 'CLS' ? '' : 'ms'}`);
    }
  });
}

// Register Service Worker in production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour
      })
      .catch((error) => {
        console.warn('SW registration failed:', error);
      });
  });
}
