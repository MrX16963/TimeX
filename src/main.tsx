import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import LandingPage from "./LandingPage";
import "./styles.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((error: unknown) => {
      console.error("TimeX could not register its offline app worker.", error);
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {window.location.pathname.endsWith("/app.html") ? <App /> : <LandingPage />}
  </React.StrictMode>,
);
