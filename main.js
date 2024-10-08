const { app, WebContentsView, BrowserWindow, ipcMain, session  } = require('electron');
const fs = require('fs');
const os = require('os');
const https = require('https');
const path = require('node:path');

let blockList = [];
let isBlockEnabled = true;

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

    loadBlockList(isBlockEnabled).then(() => {
        view.webContents.reload();
    });
    setupAdBlocker(isBlockEnabled, session.defaultSession);

    if (app.isPackaged) {
        mainWindow.loadFile('dist/browser-template/browser/index.html');
    } else {
        mainWindow.loadURL('http://localhost:4200')
    }

    mainWindow.setMenuBarVisibility(false);

    const view = new WebContentsView();
    mainWindow.contentView.addChildView(view);

    /**
     * Ajuste la vue du navigateur à la taille de la fenêtre principale.
     * @returns {void}
     */
    function fitViewToWin() {
        const winSize = mainWindow.webContents.getOwnerBrowserWindow().getBounds();
        view.setBounds({ x: 0, y: 128, width: winSize.width, height: winSize.height - 128 });
    }

    /**
     * Événement déclenché lorsqu'une navigation est effectuée.
     * @param {Electron.Event} event Événement de navigation.
     * @param {string} url URL de la page.
     * @returns {void}
     */
    view.webContents.on('did-navigate', (event, url) => {
        mainWindow.webContents.send('update-url', url, view.webContents.getTitle());
    });

    /**
     * Événement déclenché lorsqu'une navigation est effectuée dans la page.
     * @param {Electron.Event} event Événement de navigation.
     * @param {string} url URL de la page.
     * @returns {void}
     */
    view.webContents.on('did-navigate-in-page', (event, url) => {
        view.webContents.send('update-url', url);
    });

    /**
     * Événement déclenché lorsqu'une capture d'écran du navigateur est effectué'.
     * @param {Electron.Event} event Événement de capture d'écran.
     * @param {Electron.Rectangle} rect Zone de capture.
     * @returns {void}
     */
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

    /**
     * Événement déclenché lorsque l'inspecteur d'élément'.
     * @returns {void}
     */
    ipcMain.on('toogle-dev-tool', () => {
        if (mainWindow.webContents.isDevToolsOpened()) {
            mainWindow.webContents.closeDevTools();
        } else {
            mainWindow.webContents.openDevTools({ mode: 'detach' });
        }
    });

    /**
     * Événement déclenché lorsque l'utilisateur fait un retour arrière.
     * @returns {void}
     */
    ipcMain.handle('go-back', () => {
        view.webContents.navigationHistory.goBack();
    });

    /**
     * Événement déclenché lorsque l'utilisateur fait un retour avant.
     * @returns {void}
     */
    ipcMain.handle('go-forward', () => {
        view.webContents.navigationHistory.goForward();
    });

    /**
     * Événement déclenché lorsque le navigateur peut faire un retour arrière.
     * @returns {boolean} `true` si le navigateur peut faire un retour arrière, sinon `false`.
     */
    ipcMain.handle('can-go-back', () => {
        return view.webContents.navigationHistory.canGoBack();
    });

    /**
     * Événement déclenché lorsque le navigateur peut faire un retour avant.
     * @returns {boolean} `true` si le navigateur peut faire un retour avant, sinon `false`.
     */
    ipcMain.handle('can-go-forward', () => {
        return view.webContents.navigationHistory.canGoForward();
    });

    /**
     * Événement déclenché lorsque la page doit être rafraîchie.
     * @returns {void}
     */
    ipcMain.handle('refresh', () => {
        view.webContents.reload();
    });

    /**
     * Événement déclenché lorsque l'utilisateur doit être redirigé vers une page.
     * @param {string} url URL de la page.
     */
    ipcMain.handle('go-to-page', (event, url) => {
        return view.webContents.loadURL(url);
    });

    /**
     * Événement déclenché lorsque l'utilisateur demande les informations de la page actuelle.
     * @returns {object} Informations de la page actuelle.
     */
    ipcMain.handle('current-url', () => {
        return {
            url: view.webContents.getURL(),
            title: view.webContents.getTitle()
        };
    });

    /**
     * Événement déclenché lorsque le navigateur doit charger la liste de blocage des publicités.
     * @param {boolean} isBlock `true` pour bloquer les publicités, sinon `false`.
     * @returns {void}
     */
    ipcMain.on('load-block-list', (event, isBlock) => {
        isBlockEnabled = !isBlock;
        loadBlockList(isBlockEnabled).then(() => {
            view.webContents.reload();
        });
        setupAdBlocker(isBlockEnabled, session.defaultSession);
    });

    /**
     * Événement déclenché lorsque le navigateur à fini de chargé.
     * @returns {void}
     */
    mainWindow.once('ready-to-show', () => {
        fitViewToWin();
        return view.webContents.loadURL('https://www.google.com');
    });

    /**
     * Événement déclenché lorsque la fenêtre est redimensionnée.
     * @returns {void}
     */
    mainWindow.on('resize', () => {
        fitViewToWin();
    });
})

/**
 * Télécharge la liste de blocage des publicités.
 * @param {string} url URL de la liste de blocage.
 * @returns {Promise<string>} La liste de blocage téléchargée.
 * @throws {Error} En cas d'erreur lors du téléchargement.
 */
function downloadBlockList(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });
            response.on('end', () => {
                resolve(data);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Parse la liste de blocage des publicités.
 * @param {string} data Liste de blocage brute.
 * @returns {string} Liste de filtres.
 */
function parseBlockList(data) {
    const lines = data.split('\n');
    const validPrefixes = ['-', '/', '_', '||', '=', '###', '##.'];

    return lines
        .map(line => line.trim())
        .filter(line => {
            return validPrefixes.some(prefix => line.startsWith(prefix));
        })
        .map(cleanFilter);
}

/**
 * Nettoie un filtre de liste de blocage.
 * @param {string} filter Filtre à nettoyer.
 * @returns {string} Filtre nettoyé.
 */
function cleanFilter(filter) {
    let cleanedFilter = filter.replace(/^\|\|/, '');
    const prefixesToRemove = ['-', '/', '_', '=', '###', '##'];
    prefixesToRemove.forEach(prefix => {
        if (cleanedFilter.startsWith(prefix)) {
            cleanedFilter = cleanedFilter.replace(prefix, '');
        }
    });
    cleanedFilter = cleanedFilter.replace(/\^/g, '');
    cleanedFilter = cleanedFilter.replace(/\$.*/, '');
    return cleanedFilter.trim();
}

/**
 * Charge la liste de blocage des publicités.
 * @returns {Promise<void>} Résultat de la promesse.
 * @throws {Error} En cas d'erreur lors du chargement.
 */
async function loadBlockList(isBlock) {
    if (isBlock) {
        try {
            const url = 'https://easylist.to/easylist/easylist.txt';
            const data = await downloadBlockList(url);
            blockList = parseBlockList(data);
            console.log(`Block list loaded : ${blockList.length} rules.`);

            const filePath = path.join(__dirname, 'blockList.txt');
            saveBlockListToFile(blockList, filePath);
        } catch (error) {
            console.error('Error downloading block list :', error);
        }
    }
}

/**
 * Normalise une URL pour la comparaison.
 * @param {string} url URL à normaliser.
 * @returns {string} URL normalisée.
 */
function normalizeUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname + urlObj.pathname;
    } catch (err) {
        console.error('URL mal formée :', url);
        return url;
    }
}

/**
 * Détermine si une URL doit être bloquée.
 * @param {string} url URL à vérifier.
 * @returns {boolean} `true` si l'URL doit être bloquée, sinon `false`.
 */
function shouldBlockUrl(url) {
    const normalizedUrl = normalizeUrl(url);
    return blockList.some(filter => {
        return normalizedUrl.includes(filter);
    });
}

/**
 * Configure le bloqueur de publicités.
 * @param {Electron.Session} session Session à configurer.
 * @returns {void}
 * @throws {Error} En cas d'erreur lors de la configuration.
 */
function setupAdBlocker(isBlock, session) {
    session.webRequest.onBeforeRequest((details, callback) => {
        const { url, resourceType } = details;

        try {
            if (isBlock && shouldBlockUrl(url)) {
                console.log(`Blocked : ${url}`);
                callback({ cancel: true });
            } else {
                callback({ cancel: false });
            }
        } catch (err) {
            console.error(`Error intercepting URL ${url}:`, err);
            callback({ cancel: false });
        }
    });
}

/**
 * Sauvegarde la liste de blocage dans un fichier.
 * @param {string[]} blockList Liste de blocage.
 * @param {string} filePath Chemin du fichier de sauvegarde.
 * @throws {Error} En cas d'erreur lors de la sauvegarde.
 * @returns {void}
 */
function saveBlockListToFile(blockList, filePath) {
    const data = blockList.join('\n');
    fs.writeFileSync(filePath, data, 'utf8');
    console.log(`Block list saved to ${filePath}`);
}