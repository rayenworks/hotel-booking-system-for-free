// Electron entry point. It runs the same Express server as `node index.js`
// inside the desktop app, then shows the site in a window.
const { app, BrowserWindow, Menu, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// Where the secrets file lives:
//  - installed app: in the user's app-data folder (never packed into the installer)
//  - `npm run electron` during development: the project folder
const envFile = () =>
    app.isPackaged
        ? path.join(app.getPath("userData"), ".env")
        : path.join(__dirname, ".env");

const ENV_TEMPLATE = (jwtSecret) => `# Settings for the Hotel Booking System desktop app.
PORT=5000
NODE_ENV=development

# Paste your MongoDB Atlas connection string here:
MONGO_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/hotel

# Auto-generated random secret used to sign admin logins. Leave it as is.
JWT_SECRET=${jwtSecret}

TRUST_PROXY=0
USE_PUBLIC_DNS=true
`;

let server = null;
let mainWindow = null;

function fail(title, message) {
    dialog.showErrorBox(title, message);
    app.quit();
}

function ensureEnvFile() {
    const file = envFile();
    if (!fs.existsSync(file)) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, ENV_TEMPLATE(crypto.randomBytes(48).toString("hex")), { mode: 0o600 });
    }
    return file;
}

function loadSettings() {
    const file = ensureEnvFile();
    require("dotenv").config({ path: file, quiet: true });

    const uri = process.env.MONGO_URI || "";
    if (!uri || uri.includes("USER:PASSWORD")) {
        shell.openPath(file); // opens the file in Notepad
        fail(
            "First-time setup",
            "Open the file that just opened in Notepad, replace the MONGO_URI line with your MongoDB " +
                "connection string, save it, and start the app again.\n\nFile location:\n" + file
        );
        return false;
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        shell.openPath(file);
        fail("Settings problem", "JWT_SECRET in your settings file must be at least 32 characters.\n\n" + file);
        return false;
    }
    // "production" makes the security headers force https, which does not exist on localhost
    if (process.env.NODE_ENV === "production") process.env.NODE_ENV = "desktop";
    return true;
}

async function startServer() {
    require("./config/dns");
    const mongoose = require("mongoose");
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
    } catch (err) {
        throw new Error(
            "Could not connect to the database.\n\n" + err.message +
                "\n\nCheck your internet connection, the MONGO_URI in:\n" + envFile() +
                "\nand that your current IP address is allowed in MongoDB Atlas (Network Access)."
        );
    }

    const expressApp = require("./index.js"); // exports the app, does not listen by itself
    const port = Number(process.env.PORT) || 5000;

    await new Promise((resolve, reject) => {
        server = expressApp.listen(port, "127.0.0.1", resolve);
        server.once("error", (err) =>
            reject(
                err.code === "EADDRINUSE"
                    ? new Error(`Port ${port} is already in use. Close the other program (or an old copy of this app) and try again.`)
                    : err
            )
        );
    });
    return port;
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "Hotel Booking System",
        autoHideMenuBar: true,
        webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true },
    });
    mainWindow.loadURL(
        "data:text/html;charset=utf-8," +
            encodeURIComponent('<body style="font-family:sans-serif;display:grid;place-items:center;height:100vh;margin:0;color:#555">Starting…</body>')
    );
    // Links to other sites open in the normal browser, never inside the app
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (/^https?:\/\//.test(url)) shell.openExternal(url);
        return { action: "deny" };
    });
    mainWindow.on("closed", () => (mainWindow = null));
}

if (!app.requestSingleInstanceLock()) {
    app.quit(); // a copy is already running
} else {
    app.on("second-instance", () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    app.whenReady().then(async () => {
        if (app.isPackaged) Menu.setApplicationMenu(null);
        if (!loadSettings()) return;

        createWindow();
        try {
            const port = await startServer();
            const origin = `http://127.0.0.1:${port}`;
            mainWindow.webContents.on("will-navigate", (e, url) => {
                if (!url.startsWith(origin) && !url.startsWith("data:")) {
                    e.preventDefault();
                    if (/^https?:\/\//.test(url)) shell.openExternal(url);
                }
            });
            mainWindow.loadURL(origin);
        } catch (err) {
            fail("Could not start", String(err && err.message ? err.message : err));
        }
    });

    app.on("window-all-closed", () => app.quit());
    app.on("before-quit", () => {
        if (server) server.close();
    });
}
