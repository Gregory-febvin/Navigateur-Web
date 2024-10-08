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
                currentUrl : async ()=>{return ""}
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