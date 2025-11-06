const { app, WebContentsView, BrowserWindow, ipcMain, session, screen, shell, clipboard } = require('electron');
const fs = require('fs');
const os = require('os');
const https = require('https');
const path = require('node:path');

let blockList = [];
let isBlockEnabled = true;

app.whenReady().then(() => {

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    const mainWindow = new BrowserWindow({
        width: width,
        height: height,
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
    view.webContents.on('did-navigate', () => {
        mainWindow.webContents.send('update-url', view.webContents.getURL(), view.webContents.getTitle());
    });

    /**
     * Événement déclenché lorsqu'une navigation est effectuée dans la page.
     * @param {Electron.Event} event Événement de navigation.
     * @param {string} url URL de la page.
     * @returns {void}
     */
    view.webContents.on('did-navigate-in-page', () => {
        mainWindow.webContents.send('update-url', view.webContents.getURL(), view.webContents.getTitle());
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
            const homePath = os.homedir();
            const imagePath = path.join(homePath, 'screenshot.png');
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
        if (view.webContents.isDevToolsOpened()) {
            view.webContents.closeDevTools();
        } else {
            view.webContents.openDevTools({ mode: 'detach' });
        }
    });

    // Note: debug menu removed per user request. PDF creation remains via 'create-pdf' handler.

    /**
     * Create a PDF of the current page using puppeteer. Returns the file path on success.
     * Options can include { path, format }
     */
    ipcMain.handle('create-pdf', async (event, options = {}) => {
        // Lazy require to avoid startup cost when puppeteer is not installed yet
        let puppeteer;
        try {
            puppeteer = require('puppeteer');
        } catch (err) {
            console.error('Puppeteer not installed:', err);
            throw new Error('Puppeteer not available. Please run npm install puppeteer');
        }

    const homePath = os.homedir();
    const filename = options.path || `page-${Date.now()}.pdf`;
    const filePath = path.isAbsolute(filename) ? filename : path.join(homePath, filename);

        try {
            // Use the URL of the view's webContents
            const url = view.webContents.getURL();

            // Launch puppeteer and point to the same URL
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2' });
            await page.pdf({ path: filePath, format: options.format || 'A4', printBackground: true });
            await browser.close();

            console.log('PDF created at', filePath);
            return filePath;
        } catch (err) {
            console.error('Error creating PDF:', err);
            throw err;
        }
    });

    /**
     * Export the current page HTML to a file in the user's home directory.
     * Returns the file path.
     */
    ipcMain.handle('export-html', async (event, options = {}) => {
        let puppeteer;
        try {
            puppeteer = require('puppeteer');
        } catch (err) {
            console.error('Puppeteer not installed:', err);
            throw new Error('Puppeteer not available. Please run npm install puppeteer');
        }

        const homePath = os.homedir();
        const filename = options.path || `page-${Date.now()}.html`;
        const filePath = path.isAbsolute(filename) ? filename : path.join(homePath, filename);

        try {
            const url = view.webContents.getURL();
            const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2' });
            const content = await page.content();
            await browser.close();

            fs.writeFileSync(filePath, content, 'utf8');
            console.log('HTML exported to', filePath);
            return filePath;
        } catch (err) {
            console.error('Error exporting HTML:', err);
            throw err;
        }
    });

    /**
     * Extract metadata from the current page using Puppeteer.
     * Returns an object with title, description, openGraph (object), canonical, mainImage.
     */
    ipcMain.handle('extract-metadata', async (event, options = {}) => {
        let puppeteer;
        try {
            puppeteer = require('puppeteer');
        } catch (err) {
            console.error('Puppeteer not installed:', err);
            throw new Error('Puppeteer not available. Please run npm install puppeteer');
        }

        try {
            const url = view.webContents.getURL();
            const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2' });

            const metadata = await page.evaluate(() => {
                const getMeta = (selector) => {
                    const el = document.querySelector(selector);
                    return el ? el.getAttribute('content') || el.getAttribute('href') || el.src || '' : '';
                };

                const meta = {};
                meta.title = document.title || '';
                meta.description = getMeta('meta[name="description"]') || getMeta('meta[itemprop="description"]') || '';

                // Open Graph
                const og = {};
                document.querySelectorAll('meta[property^="og:"]').forEach(m => {
                    const prop = m.getAttribute('property');
                    const key = prop.replace(/^og:/, '');
                    og[key] = m.getAttribute('content') || '';
                });

                const canonicalEl = document.querySelector('link[rel="canonical"]');
                const canonical = canonicalEl ? canonicalEl.getAttribute('href') : '';

                // Try to find a main image: og:image or largest image on page as fallback
                let mainImage = og.image || '';
                if (!mainImage) {
                    const imgs = Array.from(document.images || []);
                    if (imgs.length) {
                        // pick the largest by area
                        imgs.sort((a, b) => (b.naturalWidth * b.naturalHeight) - (a.naturalWidth * a.naturalHeight));
                        mainImage = imgs[0].src || '';
                    }
                }

                return { title: meta.title, description: meta.description, openGraph: og, canonical, mainImage };
            });

            await browser.close();
            console.log('Metadata extracted for', url);
            return metadata;
        } catch (err) {
            console.error('Error extracting metadata:', err);
            throw err;
        }
    });

    /**
     * Start/stop network capture (HAR-like) using the webContents debugger.
     * start-har: attaches debugger and collects network events
     * stop-har: builds a HAR-like JSON and saves it to homedir
     */
    const harState = {
        attached: false,
        requests: {},
        entries: []
    };

    ipcMain.handle('start-har', async () => {
        try {
            if (harState.attached) return true;
            const dbg = view.webContents.debugger;
            try {
                dbg.attach('1.3');
            } catch (err) {
                // already attached or not supported
            }
            dbg.on('message', (event, method, params) => {
                try {
                    if (method === 'Network.requestWillBeSent') {
                        const r = params.request;
                        harState.requests[params.requestId] = harState.requests[params.requestId] || {};
                        harState.requests[params.requestId].request = r;
                        harState.requests[params.requestId].requestTime = params.timestamp || Date.now()/1000;
                    } else if (method === 'Network.responseReceived') {
                        harState.requests[params.requestId] = harState.requests[params.requestId] || {};
                        harState.requests[params.requestId].response = params.response;
                        harState.requests[params.requestId].responseTime = params.timestamp || Date.now()/1000;
                    } else if (method === 'Network.loadingFinished') {
                        harState.requests[params.requestId] = harState.requests[params.requestId] || {};
                        harState.requests[params.requestId].loadingFinished = params;
                    } else if (method === 'Network.loadingFailed') {
                        harState.requests[params.requestId] = harState.requests[params.requestId] || {};
                        harState.requests[params.requestId].loadingFailed = params;
                    }
                } catch (e) {
                    console.error('HAR message handler error', e);
                }
            });

            await view.webContents.debugger.sendCommand('Network.enable');
            harState.attached = true;
            harState.requests = {};
            harState.entries = [];
            console.log('HAR capture started');
            return true;
        } catch (err) {
            console.error('Error starting HAR capture:', err);
            return false;
        }
    });

    ipcMain.handle('stop-har', async () => {
        try {
            if (!harState.attached) return null;
            // Build entries from collected requests
            const entries = [];
            for (const reqId of Object.keys(harState.requests)) {
                const rec = harState.requests[reqId];
                if (!rec.request) continue;
                const startedDateTime = new Date((rec.requestTime || Date.now()/1000) * 1000).toISOString();
                const time = (((rec.loadingFinished && rec.loadingFinished.timestamp) || rec.responseTime || rec.requestTime) - (rec.requestTime || rec.responseTime || 0)) * 1000;
                const request = {
                    method: rec.request.method,
                    url: rec.request.url,
                    headers: rec.request.headers || {},
                    postData: rec.request.postData || '',
                };
                const response = rec.response ? {
                    status: rec.response.status,
                    statusText: rec.response.statusText || '',
                    headers: rec.response.headers || {},
                    mimeType: rec.response.mimeType || '',
                    encodedBodySize: (rec.loadingFinished && rec.loadingFinished.encodedDataLength) || 0
                } : { status: 0, statusText: '', headers: {}, mimeType: '', encodedBodySize: 0 };

                entries.push({ startedDateTime, time: Math.max(0, Math.round(time)), request, response });
            }

            const har = {
                log: {
                    version: '1.2',
                    creator: { name: 'Navigateur-Web', version: '1.0' },
                    entries
                }
            };

            const homePath = os.homedir();
            const filename = `network-${Date.now()}.har`;
            const filePath = path.join(homePath, filename);
            fs.writeFileSync(filePath, JSON.stringify(har, null, 2), 'utf8');

            try {
                await view.webContents.debugger.sendCommand('Network.disable');
            } catch (e) {
                console.warn('Error disabling Network domain', e);
            }
            try { view.webContents.debugger.detach(); } catch (e) {}

            harState.attached = false;
            harState.requests = {};
            harState.entries = [];

            console.log('HAR saved to', filePath);
            return filePath;
        } catch (err) {
            console.error('Error stopping HAR capture:', err);
            return null;
        }
    });

    // HAR file management: list, open, reveal, copy path
    ipcMain.handle('list-hars', async () => {
        try {
            const homePath = os.homedir();
            const files = fs.readdirSync(homePath).filter(f => f.startsWith('network-') && f.endsWith('.har'));
            const full = files.map(f => path.join(homePath, f));
            return full.sort((a,b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
        } catch (err) {
            console.error('Error listing HARs', err);
            return [];
        }
    });

    ipcMain.handle('open-har', async (event, filePath) => {
        try {
            await shell.openPath(filePath);
            return true;
        } catch (err) {
            console.error('Error opening HAR', err);
            return false;
        }
    });

    ipcMain.handle('reveal-har', async (event, filePath) => {
        try {
            shell.showItemInFolder(filePath);
            return true;
        } catch (err) {
            console.error('Error revealing HAR', err);
            return false;
        }
    });

    ipcMain.handle('copy-har-path', async (event, filePath) => {
        try {
            clipboard.writeText(filePath);
            return true;
        } catch (err) {
            console.error('Error copying HAR path', err);
            return false;
        }
    });

    // Show a dedicated always-on-top HAR panel window so it appears above WebContentsView.
    let harPanelWin = null;
    ipcMain.handle('show-har-panel', async () => {
        try {
            if (harPanelWin) {
                try { harPanelWin.focus(); } catch (e) {}
                return true;
            }

            harPanelWin = new BrowserWindow({
                width: 480,
                height: 520,
                alwaysOnTop: true,
                resizable: true,
                minimizable: false,
                maximizable: false,
                skipTaskbar: true,
                title: 'HAR files',
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false
                }
            });

            const panelHtml = `<!doctype html><html><head><meta charset="utf-8"><title>HAR files</title>
                <style>body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:12px;background:#fff}h3{margin:0 0 10px}ul{list-style:none;padding:0;margin:0}li{display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee}
                .actions button{margin-left:6px}</style></head><body>
                <h3>HAR files</h3>
                <div id="list">Loading...</div>
                <script>
                const { ipcRenderer } = require('electron');
                async function load(){
                    const list = await ipcRenderer.invoke('list-hars');
                    const container = document.getElementById('list');
                    if (!list || list.length === 0) { container.innerHTML = '<div>No HAR files found</div>'; return; }
                    const ul = document.createElement('ul');
                    list.forEach(p => {
                        const li = document.createElement('li');
                        const span = document.createElement('div'); span.style.flex='1'; span.style.marginRight='8px'; span.style.overflow='hidden'; span.style.textOverflow='ellipsis'; span.style.whiteSpace='nowrap'; span.textContent = p;
                        const actions = document.createElement('div'); actions.className='actions';
                        const open = document.createElement('button'); open.textContent='Open'; open.onclick = ()=> ipcRenderer.invoke('open-har', p);
                        const reveal = document.createElement('button'); reveal.textContent='Reveal'; reveal.onclick = ()=> ipcRenderer.invoke('reveal-har', p);
                        const copy = document.createElement('button'); copy.textContent='Copy'; copy.onclick = ()=> { ipcRenderer.invoke('copy-har-path', p); alert('Path copied'); };
                        actions.appendChild(open); actions.appendChild(reveal); actions.appendChild(copy);
                        li.appendChild(span); li.appendChild(actions); ul.appendChild(li);
                    });
                    container.innerHTML=''; container.appendChild(ul);
                }
                load();
                </script>
                </body></html>`;

            harPanelWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(panelHtml));
            harPanelWin.on('closed', () => { harPanelWin = null; });
            return true;
        } catch (err) {
            console.error('Error showing HAR panel', err);
            return false;
        }
    });

    // Show automation panel and run automation scripts using Puppeteer
    let automationWin = null;
    ipcMain.handle('show-automation-panel', async () => {
        try {
            if (automationWin) { try { automationWin.focus(); } catch(e){}; return true; }

            automationWin = new BrowserWindow({
                width: 640,
                height: 520,
                alwaysOnTop: true,
                resizable: true,
                skipTaskbar: true,
                title: 'Automation',
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false
                }
            });

            const sample = JSON.stringify([
                { action: 'goto', url: 'https://example.com' },
                { action: 'wait', ms: 500 },
                { action: 'screenshot', path: 'auto-screenshot.png' }
            ], null, 2);

            const panelHtml = `<!doctype html><html><head><meta charset="utf-8"><title>Automation</title>
                <style>body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:12px;background:#fff}textarea{width:100%;height:300px;font-family:monospace}button{margin-right:8px}</style></head><body>
                <h3>Automation script (JSON array of steps)</h3>
                <textarea id="script">${sample}</textarea>
                <div style="margin-top:8px">
                  <button id="run">Run</button>
                  <button id="close">Close</button>
                </div>
                <pre id="out" style="white-space:pre-wrap;margin-top:8px;background:#f9f9f9;padding:8px;border:1px solid #eee;height:120px;overflow:auto"></pre>
                <script>
                const { ipcRenderer } = require('electron');
                document.getElementById('run').addEventListener('click', async ()=>{
                    const txt = document.getElementById('script').value;
                    let obj;
                    try { obj = JSON.parse(txt); } catch(e){ document.getElementById('out').textContent = 'Invalid JSON: '+e; return; }
                    document.getElementById('out').textContent = 'Running...';
                    try {
                        const res = await ipcRenderer.invoke('run-automation', obj);
                        document.getElementById('out').textContent = JSON.stringify(res, null, 2);
                    } catch (err) {
                        document.getElementById('out').textContent = 'Error: '+String(err);
                    }
                });
                document.getElementById('close').addEventListener('click', ()=>window.close());
                </script>
                </body></html>`;

            automationWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(panelHtml));
            automationWin.on('closed', () => { automationWin = null; });
            return true;
        } catch (err) {
            console.error('Error showing automation panel', err);
            return false;
        }
    });

    ipcMain.handle('run-automation', async (event, script) => {
        // script is expected to be an array of steps
        try {
            let puppeteer;
            try { puppeteer = require('puppeteer'); } catch (e) { throw new Error('Puppeteer not installed'); }

            const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
            const page = await browser.newPage();

            // Transfer relevant cookies from Electron session to Puppeteer for the page URL (best-effort)
            try {
                const url = (view && view.webContents) ? view.webContents.getURL() : null;
                if (url) {
                    const cookieList = await session.defaultSession.cookies.get({});
                    const parsed = new URL(url);
                    const domain = parsed.hostname;
                    const cookiesToSet = cookieList.filter(c => c.domain && c.domain.includes(domain)).map(c => ({
                        name: c.name,
                        value: c.value,
                        domain: c.domain.startsWith('.') ? c.domain.substring(1) : c.domain,
                        path: c.path || '/',
                        httpOnly: !!c.httpOnly,
                        secure: !!c.secure,
                        expires: c.expirationDate ? Math.floor(c.expirationDate) : undefined
                    }));
                    if (cookiesToSet.length) await page.setCookie(...cookiesToSet);
                }
            } catch (e) {
                console.warn('Cookie transfer failed', e);
            }

            const outputs = [];
            const extracts = {};
            const homePath = os.homedir();

            for (const step of script) {
                const action = (step.action || '').toLowerCase();
                if (action === 'goto' && step.url) {
                    await page.goto(step.url, { waitUntil: 'networkidle2' });
                } else if (action === 'wait' && step.ms) {
                    await page.waitForTimeout(Number(step.ms));
                } else if (action === 'waitforselector' && step.selector) {
                    await page.waitForSelector(step.selector, { timeout: step.timeout || 5000 });
                } else if (action === 'click' && step.selector) {
                    await page.waitForSelector(step.selector, { timeout: 5000 });
                    await page.click(step.selector);
                    if (step.waitForNavigation) await page.waitForNavigation({ waitUntil: 'networkidle2' });
                } else if (action === 'type' && step.selector) {
                    await page.waitForSelector(step.selector, { timeout: 5000 });
                    await page.type(step.selector, String(step.value || ''), { delay: step.delay || 10 });
                    if (step.enter) await page.keyboard.press('Enter');
                } else if (action === 'screenshot') {
                    const filename = step.path || `automation-screenshot-${Date.now()}.png`;
                    const filePath = path.isAbsolute(filename) ? filename : path.join(homePath, filename);
                    await page.screenshot({ path: filePath, fullPage: !!step.fullPage });
                    outputs.push({ type: 'screenshot', path: filePath });
                } else if (action === 'pdf') {
                    const filename = step.path || `automation-${Date.now()}.pdf`;
                    const filePath = path.isAbsolute(filename) ? filename : path.join(homePath, filename);
                    await page.pdf({ path: filePath, format: step.format || 'A4', printBackground: true });
                    outputs.push({ type: 'pdf', path: filePath });
                } else if (action === 'extract' && step.selector) {
                    try {
                        const val = await page.$eval(step.selector, el => el.textContent || '');
                        extracts[step.name || step.selector] = val.trim();
                    } catch (e) {
                        extracts[step.name || step.selector] = null;
                    }
                } else {
                    // unknown action: ignore or log
                    console.warn('Unknown automation action', action);
                }
            }

            await browser.close();
            return { success: true, outputs, extracts };
        } catch (err) {
            console.error('Automation error', err);
            return { success: false, error: String(err) };
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