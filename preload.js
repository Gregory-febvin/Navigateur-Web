const { contextBridge, ipcRenderer } = require('electron/renderer');

console.log('preload.js: Preload chargé avec succès.');

contextBridge.exposeInMainWorld('electronAPI', {
    captureScreen: (rect) => ipcRenderer.send('capture-screen', rect),
    toogleDevTool: () => ipcRenderer.send('toogle-dev-tool'),

    goBack: () => ipcRenderer.invoke('go-back'),
    goForward: () => ipcRenderer.invoke('go-forward'),

    onUpdateUrl: (callback) => {
        ipcRenderer.on('update-url', (event, url, title) => {
            console.log('preload.js: update-url reçu avec', url, title);
            callback({ url, title });
        });
    },

    refresh: () => ipcRenderer.invoke('refresh'),
    canGoForward: () => ipcRenderer.invoke('can-go-forward'),
    canGoBack: () => ipcRenderer.invoke('can-go-back'),
    goToPage: (url) => ipcRenderer.invoke('go-to-page', url),
    currentUrl: () => ipcRenderer.invoke('current-url'),
});