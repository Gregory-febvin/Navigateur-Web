const { app, WebContentsView, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('node:path');

app.whenReady().then(() => {

    const mainWindow = new BrowserWindow({
        width: 800,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            disableHtmlFullscreenWindowResize: true,
            disableHardwareAcceleration: true,
            spellcheck: false,
        }
    });

    if (app.isPackaged) {
        mainWindow.loadFile('dist/browser-template/browser/index.html');
    } else {
        mainWindow.loadURL('http://localhost:4200')
    }

    mainWindow.setMenuBarVisibility(false);

    const view = new WebContentsView();
    mainWindow.contentView.addChildView(view);

    function fitViewToWin() {
        const winSize = mainWindow.webContents.getOwnerBrowserWindow().getBounds();
        view.setBounds({ x: 0, y: 128, width: winSize.width, height: winSize.height - 128 });
    }

    view.webContents.on('did-navigate', (event, url) => {
        view.webContents.send('update-url', url);
        console.log('did-navigate', url);
    });

    view.webContents.on('did-navigate-in-page', (event, url) => {
        view.webContents.send('update-url', url);
    });

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
                mainWindow.webContents.send('captured-screen', `Image sauvegardée à: ${imagePath}`);
                console.log('Capture de la page réussie', imagePath);
            });
        }).catch(err => {
            console.error('Erreur lors de la capture de la page:', err);
        });
    });

    ipcMain.on('toogle-dev-tool', () => {
        if (mainWindow.webContents.isDevToolsOpened()) {
            mainWindow.webContents.closeDevTools();
        } else {
            mainWindow.webContents.openDevTools({ mode: 'detach' });
        }
    });

    ipcMain.handle('go-back', () => {
        view.webContents.navigationHistory.goBack();
    });

    ipcMain.handle('go-forward', () => {
        view.webContents.navigationHistory.goForward();
    });

    ipcMain.handle('can-go-back', () => {
        return view.webContents.navigationHistory.canGoBack();
    });

    ipcMain.handle('can-go-forward', () => {
        return view.webContents.navigationHistory.canGoForward();
    });

    ipcMain.handle('refresh', () => {
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

    mainWindow.once('ready-to-show', () => {
        fitViewToWin();
        return view.webContents.loadURL('https://www.google.com');
    });

    mainWindow.on('resize', () => {
        fitViewToWin();
    });
})