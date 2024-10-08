const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('electronAPI', {
    captureScreen: (rect) => ipcRenderer.send('capture-screen', rect),
    toogleDevTool: () => ipcRenderer.send('toogle-dev-tool'),
    loadBlockList: (isBlock) => ipcRenderer.send('load-block-list', isBlock),

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