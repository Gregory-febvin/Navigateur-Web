const { app, WebContentsView, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('node:path');

app.whenReady().then(() => {

  // BrowserWindow initiate the rendering of the angular toolbar
  const win = new BrowserWindow({
    width: 800,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      disableHtmlFullscreenWindowResize: true,
      disableHardwareAcceleration: true,
      spellcheck: false,
    }
  });

  if (app.isPackaged){
    win.loadFile('dist/browser-template/browser/index.html');
  }else{
    win.loadURL('http://localhost:4200')
  }

  win.setMenuBarVisibility(false);

  // WebContentsView initiate the rendering of a second view to browser the web
  const view = new WebContentsView();
  win.contentView.addChildView(view);

  // Always fit the web rendering with the electron windows
  function fitViewToWin() {
    const winSize = win.webContents.getOwnerBrowserWindow().getBounds();
    view.setBounds({ x: 0, y: 128, width: winSize.width, height: winSize.height - 128 });
  }

  ipcMain.on('capture-screen', (event, rect) => {
    const opts = { format: 'png', quality: 100 };

    view.webContents.capturePage(rect, opts).then((image) => {
      const downloadsPath = path.join(os.homedir(), 'Downloads');
      const imagePath = path.join(downloadsPath, 'screenshot.png');
      fs.writeFile(imagePath, image.toPNG(), (err) => {
        if (err) {
          console.error('Erreur lors de la sauvegarde de l\'image:', err);
          return;
        }
        win.webContents.send('captured-screen', `Image sauvegardée à: ${imagePath}`);
        console.log('Capture de la page réussie', imagePath);
      });
    }).catch(err => {
      console.error('Erreur lors de la capture de la page:', err);
    });
  });

  // Register events handling from the toolbar
  ipcMain.on('toogle-dev-tool', () => {
    if (win.webContents.isDevToolsOpened()) {
      win.webContents.closeDevTools();
    } else {
      win.webContents.openDevTools({ mode: 'detach' });
    }
  });

  ipcMain.on('go-back', () => {
    view.webContents.navigationHistory.goBack();
  });

  ipcMain.handle('can-go-back', () => {
    return view.webContents.navigationHistory.canGoBack();
  });

  ipcMain.on('go-forward', () => {
    view.webContents.navigationHistory.goForward();
  });

  ipcMain.handle('can-go-forward', () => {
    return view.webContents.navigationHistory.canGoForward();
  });

  ipcMain.on('refresh', () => {
    view.webContents.reload();
  });

  ipcMain.handle('go-to-page', (event, url) => {
    return view.webContents.loadURL(url);
  });

  ipcMain.handle('current-url', () => {
    return {
      url: view.webContents.getURL(),
      title: view.webContents.getTitle()
    };
  });

  win.once('ready-to-show', () => {
    fitViewToWin();
    return view.webContents.loadURL('https://www.google.com');
  });

  win.on('resize', () => {
    fitViewToWin();
  });
})
