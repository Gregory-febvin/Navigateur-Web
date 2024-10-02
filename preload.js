const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('electronAPI', {
    captureScreen: (rect) => ipcRenderer.send('capture-screen', rect),
    toogleDevTool: () => ipcRenderer.send('toogle-dev-tool'),

    goBack: () => ipcRenderer.invoke('go-back'),
    goForward: () => ipcRenderer.invoke('go-forward'),

    onUpdateUrl: (callback) => {
        ipcRenderer.on('update-url', callback);
    },

    refresh: () => ipcRenderer.invoke('refresh'),
    canGoForward: () => ipcRenderer.invoke('can-go-forward'),
    canGoBack: () => ipcRenderer.invoke('can-go-back'),
    goToPage: (url) => ipcRenderer.invoke('go-to-page', url),
    currentUrl: () => ipcRenderer.invoke('current-url'),

    loadBlockList: (isBlock) => ipcRenderer.send('load-block-list', isBlock),
});