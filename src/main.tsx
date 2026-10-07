import React from "react";
import ReactDOM from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App";
import LandingPage from "./LandingPage";
import "./styles.css";
import "./landing-theme.css";

if (
  "serviceWorker" in navigator &&
  (window.location.protocol === "http:" || window.location.protocol === "https:")
) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js?v=3`, { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch((error: unknown) => {
        console.error("TimeX could not update its offline app worker.", error);
      });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {Capacitor.isNativePlatform() || window.location.pathname.endsWith("/app.html") ? (
      <App />
    ) : (
      <LandingPage />
    )}
  </React.StrictMode>,
);
