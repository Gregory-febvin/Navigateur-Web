const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('electronAPI', {
    captureScreen: (rect) => ipcRenderer.send('capture-screen', rect),
    toogleDevTool: () => ipcRenderer.send('toogle-dev-tool'),
    loadBlockList: (isBlock) => ipcRenderer.send('load-block-list', isBlock),

    /* Ask main process to create a PDF of the current page. Returns path or error. */
    createPdf: (options) => ipcRenderer.invoke('create-pdf', options),
    /* Export the current page HTML to a file in the user's home directory. */
    exportHtml: (options) => ipcRenderer.invoke('export-html', options),
    /* Extract metadata (title, description, og tags, main image) from the current page. */
    extractMetadata: (options) => ipcRenderer.invoke('extract-metadata', options),
    /* Start and stop network HAR capture */
    startHar: () => ipcRenderer.invoke('start-har'),
    stopHar: () => ipcRenderer.invoke('stop-har'),
    listHars: () => ipcRenderer.invoke('list-hars'),
    openHar: (filePath) => ipcRenderer.invoke('open-har', filePath),
    revealHar: (filePath) => ipcRenderer.invoke('reveal-har', filePath),
    copyHarPath: (filePath) => ipcRenderer.invoke('copy-har-path', filePath),
    showHarPanel: () => ipcRenderer.invoke('show-har-panel'),
    showAutomationPanel: () => ipcRenderer.invoke('show-automation-panel'),

    onUpdateUrl: (callback) => {
        ipcRenderer.on('update-url', callback);
    },

    refresh: () => ipcRenderer.invoke('refresh'),
    goBack: () => ipcRenderer.invoke('go-back'),
    goForward: () => ipcRenderer.invoke('go-forward'),
    canGoForward: () => ipcRenderer.invoke('can-go-forward'),
    canGoBack: () => ipcRenderer.invoke('can-go-back'),
    goToPage: (url) => ipcRenderer.invoke('go-to-page', url),
    currentUrl: () => ipcRenderer.invoke('current-url'),
});