// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

export type Version = {
    currentVersion: () => Promise<string>;
};
export interface VersionInfo {
    version: Version;
    name: string;
    productName: string;
    os: string;
    platform: string;
    defaultApp: boolean;
    file: string;
}


// const version = ipcRenderer.invoke('get-current-version');
contextBridge.exposeInMainWorld('currentVersion', {
    currentVersion: (): Promise<Version> => ipcRenderer.invoke('get-current-version')
});

declare global {
   interface Window {
       currentVersion: Version;
   }
}
