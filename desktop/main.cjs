const path = require("node:path");
const { app, BrowserWindow, ipcMain, Menu, shell } = require("electron");

let mainWindow;
let queuedAuthUrl = null;
const hostedAppUrl = "https://mrx16963.github.io/TimeX/app.html";

const initialAuthUrl = process.argv.find((argument) =>
  argument.startsWith("timex://login-callback"),
);
if (initialAuthUrl) queuedAuthUrl = initialAuthUrl;

function deliverAuthUrl(url) {
  if (!url.startsWith("timex://login-callback")) return;
  if (mainWindow?.webContents.isLoadingMainFrame() === false) {
    mainWindow.webContents.send("timex:auth-callback", url);
  } else {
    queuedAuthUrl = url;
  }
}

if (process.defaultApp && process.argv.length >= 2) {
  app.setAsDefaultProtocolClient("timex", process.execPath, [path.resolve(process.argv[1])]);
} else {
  app.setAsDefaultProtocolClient("timex");
}

const hasInstanceLock = app.requestSingleInstanceLock();
if (!hasInstanceLock) app.quit();

app.on("second-instance", (_event, argv) => {
  const authUrl = argv.find((argument) => argument.startsWith("timex://login-callback"));
  if (authUrl) deliverAuthUrl(authUrl);
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on("open-url", (event, url) => {
  event.preventDefault();
  deliverAuthUrl(url);
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 360,
    minHeight: 560,
    show: false,
    autoHideMenuBar: true,
    title: "TimeX",
    icon: path.join(__dirname, "..", "public", "icons", "timex.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  Menu.setApplicationMenu(null);
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.webContents.on("did-finish-load", () => {
    if (queuedAuthUrl) {
      mainWindow.webContents.send("timex:auth-callback", queuedAuthUrl);
      queuedAuthUrl = null;
    }
  });

  const bundledAppEntry = app.isPackaged
    ? path.join(process.resourcesPath, "app", "app.html")
    : path.join(__dirname, "..", "dist", "app.html");
  let usingBundledFallback = false;

  mainWindow.webContents.once("did-fail-load", (_event, errorCode, _errorDescription, validatedUrl, isMainFrame) => {
    if (
      isMainFrame &&
      !usingBundledFallback &&
      validatedUrl.startsWith(hostedAppUrl) &&
      errorCode !== -3
    ) {
      usingBundledFallback = true;
      void mainWindow.loadFile(bundledAppEntry);
    }
  });

  void mainWindow.loadURL(hostedAppUrl);
}

app.whenReady().then(() => {
  ipcMain.handle("timex:open-external", async (_event, rawUrl) => {
    if (typeof rawUrl !== "string") throw new Error("Only web URLs can be opened.");
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("Only secure web URLs can be opened externally.");
    }
    await shell.openExternal(url.href);
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
