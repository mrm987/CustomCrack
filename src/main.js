const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const CRACK_URL = 'https://crack.wrtn.ai/';
let mainWindow;

// 파일 내용을 메모리에 캐싱 (매 네비게이션마다 디스크 I/O 방지)
const fileCache = {};
function readCached(filePath) {
  if (!fileCache[filePath] || fileCache[filePath].mtime !== fs.statSync(filePath, { throwIfNoEntry: false })?.mtimeMs) {
    try {
      const stat = fs.statSync(filePath);
      fileCache[filePath] = { content: fs.readFileSync(filePath, 'utf-8'), mtime: stat.mtimeMs };
    } catch { return ''; }
  }
  return fileCache[filePath].content;
}

// Ctrl+Shift+R 핫 리로드 시 캐시 무효화
function invalidateCache() {
  for (const key of Object.keys(fileCache)) delete fileCache[key];
}

function createWindow() {
  const iconPath = path.join(__dirname, '..', 'build', 'icon.png');

  const isMac = process.platform === 'darwin';

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'C.Crack',
    icon: iconPath,
    frame: false,
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    trafficLightPosition: isMac ? { x: 12, y: 12 } : undefined,
    autoHideMenuBar: true,
    backgroundColor: '#1e1e2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(CRACK_URL);

  // 웹페이지가 타이틀을 변경해도 CC 유지
  mainWindow.on('page-title-updated', (e) => {
    e.preventDefault();
  });

  // 페이지 로드 완료 시 커스텀 CSS/JS 주입
  mainWindow.webContents.on('did-finish-load', () => {
    injectCustomStyles();
    injectCustomScript();
    injectTitleBar();
  });

  // SPA 내부 네비게이션에도 재주입 (디바운스)
  let navTimer = null;
  mainWindow.webContents.on('did-navigate-in-page', () => {
    if (navTimer) clearTimeout(navTimer);
    navTimer = setTimeout(() => {
      injectCustomStyles();
      injectCustomScript();
      injectTitleBar();
    }, 150);
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
  ipcMain.on('traffic-lights-visible', (_, visible) => {
    if (isMac) {
      mainWindow.setWindowButtonVisibility(visible);
    }
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

let lastCssKey = null;

function injectCustomStyles() {
  const cssPath = path.join(__dirname, 'custom.css');
  const css = readCached(cssPath);
  if (!css.trim()) return;

  // 이전 CSS 제거 후 재삽입 (스타일 누적 방지)
  const removeOld = lastCssKey
    ? mainWindow.webContents.removeInsertedCSS(lastCssKey).catch(() => {})
    : Promise.resolve();

  removeOld.then(() => {
    mainWindow.webContents.insertCSS(css).then(key => { lastCssKey = key; }).catch(() => {});
  });
}

function injectCustomScript() {
  const jsPath = path.join(__dirname, 'custom.js');
  const js = readCached(jsPath);
  if (!js.trim()) return;

  mainWindow.webContents.executeJavaScript(js).catch(() => {});
}

function injectTitleBar() {
  const jsPath = path.join(__dirname, 'titlebar.js');
  const js = readCached(jsPath);
  if (!js.trim()) return;

  mainWindow.webContents.executeJavaScript(js).catch(() => {});
}

// 중복 실행 방지
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// 캐시 용량 제한 (500MB)
app.commandLine.appendSwitch('disk-cache-size', String(500 * 1024 * 1024));

// GPU 가속 & 렌더링 최적화
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

// Ctrl+Shift+R: 커스텀 CSS/JS 핫 리로드 (페이지 새로고침 없이 재주입)
app.whenReady().then(() => {
  createWindow();

  globalShortcut.register('CommandOrControl+Shift+R', () => {
    if (mainWindow) {
      invalidateCache();
      injectCustomStyles();
      injectCustomScript();
      injectTitleBar();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
