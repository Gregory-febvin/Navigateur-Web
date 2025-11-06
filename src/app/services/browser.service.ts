// src/app/browser.service.ts
import { Injectable, EventEmitter } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class BrowserService {
    url = '';
    title = '';
    canGoBack = false;
    canGoForward = false;

    public onPageChange: EventEmitter<{ url: string, title: string }> = new EventEmitter();

    // @ts-ignore
    electronAPI = window.electronAPI;

    constructor() {
        if (!this.electronAPI){
            this.electronAPI = {
                onUpdateUrl : ()=>{},
                currentUrl : async ()=>{return ""},
                createPdf : async ()=>{return ''},
                exportHtml: async ()=>{return ''},
                extractMetadata: async ()=>{return {}},
                startHar: async ()=>{return true},
                stopHar: async ()=>{return ''}
            }
        }

        /**
         * Ecoute l'événement onUpdateUrl pour mettre à jour l'url courante
         * @param event 
         * @param url 
         * @param title 
         * @returns {void}
         */
        const updateUrl = (event: any, url: any, title: any) => {
            this.url = url;
            this.title = title;
            this.setToCurrentUrl();
            this.emitPageChange();
            this.updateHistory();
        };

        this.electronAPI.onUpdateUrl(updateUrl);
    }

    /**
     * Envoie un message à l'API Electron pour faire une capture d'écran
     * @param {object} rect
     * @returns {void}
     */
    captureScreen(rect?: { x: number, y: number, width: number, height: number }) {
        this.electronAPI.captureScreen(rect);
    }

    /**
     * Envoie un message à l'API Electron pour ouvrir la console de développement
     * @returns {void}
     */
    toogleDevTool() {
        this.electronAPI.toogleDevTool();
    }

    /**
     * Ask main to create a PDF for the current page. Returns the path.
     */
    createPdf(options?: { path?: string, format?: string }) {
        if (this.electronAPI.createPdf) {
            return this.electronAPI.createPdf(options);
        }
        return Promise.reject(new Error('createPdf not available'));
    }

    /**
     * Ask main to export current page HTML to a file. Returns the file path.
     */
    exportHtml(options?: { path?: string }) {
        if (this.electronAPI.exportHtml) {
            return this.electronAPI.exportHtml(options);
        }
        return Promise.reject(new Error('exportHtml not available'));
    }

    /**
     * Ask main to extract page metadata via Puppeteer. Returns a metadata object.
     */
    extractMetadata(options?: any) {
        if (this.electronAPI.extractMetadata) {
            return this.electronAPI.extractMetadata(options);
        }
        return Promise.reject(new Error('extractMetadata not available'));
    }

    /**
     * Start network HAR capture (returns true on success)
     */
    startHar() {
        if (this.electronAPI.startHar) {
            return this.electronAPI.startHar();
        }
        return Promise.reject(new Error('startHar not available'));
    }

    /**
     * Stop network HAR capture and save to file. Returns the file path.
     */
    stopHar() {
        if (this.electronAPI.stopHar) {
            return this.electronAPI.stopHar();
        }
        return Promise.reject(new Error('stopHar not available'));
    }

    /**
     * List saved HAR files in the home directory.
     */
    listHars() {
        if (this.electronAPI.listHars) {
            return this.electronAPI.listHars();
        }
        return Promise.resolve([]);
    }

    openHar(filePath: string) {
        if (this.electronAPI.openHar) {
            return this.electronAPI.openHar(filePath);
        }
        return Promise.reject(new Error('openHar not available'));
    }

    revealHar(filePath: string) {
        if (this.electronAPI.revealHar) {
            return this.electronAPI.revealHar(filePath);
        }
        return Promise.reject(new Error('revealHar not available'));
    }

    copyHarPath(filePath: string) {
        if (this.electronAPI.copyHarPath) {
            return this.electronAPI.copyHarPath(filePath);
        }
        return Promise.reject(new Error('copyHarPath not available'));
    }

    showHarPanel() {
        if (this.electronAPI.showHarPanel) {
            return this.electronAPI.showHarPanel();
        }
        return Promise.reject(new Error('showHarPanel not available'));
    }

    showAutomationPanel() {
        if (this.electronAPI.showAutomationPanel) {
            return this.electronAPI.showAutomationPanel();
        }
        return Promise.reject(new Error('showAutomationPanel not available'));
    }

    /**
     * Envoie un message à l'API Electron pour charger la liste des sites bloqués ou autorisés
     * @param {boolean} isBlock 
     * @returns {void}
     */
    loadBlockList(isBlock: boolean) {
        this.electronAPI.loadBlockList(isBlock);
    }

    /**
     * Envoie un message à l'API Electron pour retourner à la page précédente et met à jour l'historique
     * @returns {void}
     */
    goBack() {
        this.electronAPI.goBack();
        this.updateHistory();
    }

    /**
     * Envoie un message à l'API Electron pour avancer à la page suivante et met à jour l'historique
     * @returns {void}
     */
    goForward() {
        this.electronAPI.goForward();
        this.updateHistory();
    }

    /**
     * Envoie un message à l'API Electron pour rafraîchir la page courante 
     * @returns {void}
     */
    refresh() {
        this.electronAPI.refresh().then(() => {
            this.setToCurrentUrl();
        }).catch((err: any) => console.error(err));
    }

    /**
     * Envoie un message à l'API Electron pour charger une nouvelle page et met à jour l'historique
     * @param {string} url 
     * @returns {void}
     */
    goToPage(url: string) {
        this.electronAPI.goToPage(url).then(() => {
            this.updateHistory();
            this.setToCurrentUrl(url);
        }).catch((err: any) => console.error(err));
    }

    /**
     * Modifier l'url et le titre courant
     * @param {string} url
     * @param {string} title
     * @returns {void}
     */
    setToCurrentUrl(url?: string, title?: string) {
        this.url = url || this.url;
        this.title = title || this.title;
    }

    /**
     * Met à jour l'historique de navigation et vérifie si on peut aller en arrière ou en avant
     * @returns {void}
     */
    updateHistory() {
        this.electronAPI.canGoBack().then((canGoBack: boolean) => {
            this.canGoBack = canGoBack;
        }).catch((err: any) => console.error(err));

        this.electronAPI.canGoForward().then((canGoForward: boolean) => {
            this.canGoForward = canGoForward;
        }).catch((err: any) => console.error(err));
    }

    /**
     * Émet un événement onPageChange
     * @returns {void}
     */
    emitPageChange() {
        this.onPageChange.emit({ url: this.url, title: this.title });
    }
}