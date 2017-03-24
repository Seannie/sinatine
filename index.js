const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, Menu, shell, globalShortcut } = require('electron')
const http = require('http')
const axios = require('axios')
const config = require('./config')
const appMenu = require('./menu');
// const tray = require('./tray');

// require('electron-debug')();
// require('electron-dl')();
// require('electron-context-menu')();

let mainWindow;
let isQuitting = false;

// TODO: not provide remote style yet
// const patchRemoteStyle = (page, url) => {
//   if (!url) {
//     page.insertCSS(fs.readFileSync(path.join(__dirname, 'custom.css'), 'utf8'));
//     return
//   }
//   axios.get(url)
//     .then(res => {
//       page.insertCSS(res.data)
//     })
//     .catch(e => {
//       // fetch failed, use local css
//       page.insertCSS(fs.readFileSync(path.join(__dirname, 'custom.css'), 'utf8'));
//     })
// }

const isAlreadyRunning = app.makeSingleInstance(() => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.show();
  }
});

if (isAlreadyRunning) {
  app.quit();
}

function createMainWindow() {
  const lastWindowState = config.get('lastWindowState');

  const win = new BrowserWindow({
    titleBarStyle: 'hidden-inset',
    x: lastWindowState.x,
    y: lastWindowState.y,
    width: lastWindowState.width,
    height: lastWindowState.height,
    width: 360,
    height: 360 / 0.618, 
    minWidth: 300,
    maxWidth: 500,
    maxHeight: 500 / 0.618,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'custom.js'),
      nodeIntegration: false,
      plugins: true
    }
  });

  if (process.platform === 'darwin') {
    win.setSheetOffset(40);
  }

  win.loadURL('http://m.weibo.cn/beta');

  win.on('close', e => {
    if (!isQuitting) {
      e.preventDefault();

      if (process.platform === 'darwin') {
        app.hide();
      } else {
        win.hide();
      }
    }
  });

  win.on('page-title-updated', e => {
    e.preventDefault();
  });

  win.on('enter-full-screen', () => {
    win.setMaximumSize(maxWindowInteger, maxWindowInteger);
  });

  win.on('leave-full-screen', () => {
    win.setMaximumSize(maxWidthValue, maxWindowInteger);
  });

  return win;
}

app.on('ready', () => {
  Menu.setApplicationMenu(appMenu);
  mainWindow = createMainWindow();
  // tray.create(mainWindow);

  const page = mainWindow.webContents;

  page.on('dom-ready', () => {
    page.insertCSS(fs.readFileSync(path.join(__dirname, 'custom.css'), 'utf8'));
    mainWindow.show();
  });

  page.on('new-window', (e, url) => {
    e.preventDefault();
    shell.openExternal(url);
  });
});

app.on('activate', () => {
  mainWindow.show();
});

app.on('before-quit', () => {
  isQuitting = true;

  globalShortcut.unregisterAll()

  if (!mainWindow.isFullScreen()) {
    config.set('lastWindowState', mainWindow.getBounds());
  }
});