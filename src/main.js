const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const CRACK_URL = 'https://crack.wrtn.ai/';
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Custom Crack',
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(CRACK_URL);

  // 페이지 로드 완료 시 커스텀 CSS/JS 주입
  mainWindow.webContents.on('did-finish-load', () => {
    injectCustomStyles();
    injectCustomScript();
    injectTitleBar();
  });

  // SPA 내부 네비게이션에도 재주입
  mainWindow.webContents.on('did-navigate-in-page', () => {
    injectCustomStyles();
    injectCustomScript();
    injectTitleBar();
  });

  // 단축키
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F5') {
      mainWindow.webContents.reload();
    }
    if (input.key === 'F11') {
      event.preventDefault();
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
    if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools();
    }
  });

  // 렌더러에서 창 조작 요청 수신
  ipcMain.on('window-minimize', () => mainWindow.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false);
    } else if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.on('window-close', () => mainWindow.close());
  ipcMain.on('window-fullscreen', () => {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  });

  // 최대화/전체화면 상태 변경 시 렌더러에 개별 알림
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('maximize-change', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('maximize-change', false);
  });
  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('fullscreen-change', true);
  });
  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('fullscreen-change', false);
  });
}

function injectCustomStyles() {
  const cssPath = path.join(__dirname, 'custom.css');
  if (!fs.existsSync(cssPath)) return;
  const css = fs.readFileSync(cssPath, 'utf-8');
  if (!css.trim()) return;

  mainWindow.webContents.insertCSS(css).catch(() => {});
}

function injectCustomScript() {
  const jsPath = path.join(__dirname, 'custom.js');
  if (!fs.existsSync(jsPath)) return;
  const js = fs.readFileSync(jsPath, 'utf-8');
  if (!js.trim()) return;

  mainWindow.webContents.executeJavaScript(js).catch(() => {});
}

function injectTitleBar() {
  const jsPath = path.join(__dirname, 'titlebar.js');
  if (!fs.existsSync(jsPath)) return;
  const js = fs.readFileSync(jsPath, 'utf-8');
  if (!js.trim()) return;

  mainWindow.webContents.executeJavaScript(js).catch(() => {});
}

// Ctrl+Shift+R: 커스텀 CSS/JS 핫 리로드 (페이지 새로고침 없이 재주입)
app.whenReady().then(() => {
  createWindow();

  globalShortcut.register('CommandOrControl+Shift+R', () => {
    if (mainWindow) {
      injectCustomStyles();
      injectCustomScript();
      injectTitleBar();
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
