const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("timexExternal", {
  openExternal: (url) => ipcRenderer.invoke("timex:open-external", url),
});

ipcRenderer.on("timex:auth-callback", (_event, url) => {
  window.dispatchEvent(new CustomEvent("timex-auth-callback", { detail: url }));
});
