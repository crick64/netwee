/* eslint-disable */
const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron');
const path = require('path');

const assetsDirectory = path.join(__dirname, 'assets');

let tray = undefined;
let window = undefined;

// Don't show the app in the doc
app.dock.hide();

app.on('ready', () => {
  createTray();
  createWindow();
});

// Quit the app when the window is closed
app.on('window-all-closed', () => {
  app.quit();
});

const createTray = () => {
  tray = new Tray(path.join(assetsDirectory, 'icons8-speed_filled.png'));

  tray.on('click', function(event) {
    toggleWindow();

    // Show devtools when command clicked
    if (window.isVisible() && process.defaultApp && event.metaKey) {
      window.openDevTools({ mode: 'detach' });
    }
  });
  tray.on('right-click', toggleWindow);
  tray.on('double-click', toggleWindow);
};

const getWindowPosition = () => {
  const windowBounds = window.getBounds();
  const trayBounds = tray.getBounds();

  // Center window horizontally below the tray icon
  const x = Math.round(
    trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2
  );

  // Position window 4 pixels vertically below the tray icon
  const y = Math.round(trayBounds.y + trayBounds.height + 4);

  return { x: x, y: y };
};

const createWindow = () => {
  window = new BrowserWindow({
    width: 280,
    height: 300,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    webPreferences: {
      // Prevents renderer process code from not running when window is
      // hidden
      backgroundThrottling: false,
      nodeIntegration: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  window.loadURL('https://fast.com');

  // Hide the window when it loses focus
  window.on('blur', () => {
    if (!window.webContents.isDevToolsOpened()) {
      window.hide();
    }
  });
};

const toggleWindow = () => {
  if (window.isVisible()) {
    window.hide();
  } else {
    showWindow();
  }
};

const showContextMenu = () => {
  tray.popUpContextMenu();
};

const showWindow = () => {
  const position = getWindowPosition();
  window.setPosition(position.x, position.y, false);
  window.show();
  window.focus();
};

ipcMain.on('show-window', () => {
  showWindow();
});

ipcMain.on('more-info-click', () => {
  window.setSize(280, 360);
});

ipcMain.on('set-title', (e, args) => {
  if (args && parseInt(args.up) === 0) {
    tray.setTitle(`${args.down}↓`);
  } else {
    tray.setTitle(`${args.down}↓ ${args.up}↑`);
  }
});

ipcMain.on('quit', () => app.quit());
