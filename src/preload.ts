// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer, MessageBoxSyncOptions } from 'electron';
import { TokenDto } from './main/token-service/types';
import { IPCHandlerResponse } from './main/types/ipc-handler-response';

export type Infos = {
    currentVersion: () => Promise<string>;
    showDialog: (data: ShowDialogDto) => Promise<number[]>;
};

export type Forms = {
    removeToken: (uuid: string) => Promise<IPCHandlerResponse<void>>;
    newToken: (token: TokenDto) => Promise<IPCHandlerResponse<boolean>>;
    getTokens: () => Promise<TokenDto[]>;
}

export type ShowDialogDto = {
    type: MessageBoxSyncOptions['type'],
    title: string;
    message: string;
    buttons?: string[];
}


contextBridge.exposeInMainWorld('infos', {
    currentVersion: (): Promise<Infos> => ipcRenderer.invoke('get-current-version'),
    showDialog: (data: ShowDialogDto): Promise<number[]> => ipcRenderer.invoke('show-dialog', data),
});

contextBridge.exposeInMainWorld('forms', {
    removeToken: (uuid: string): Promise<boolean> => ipcRenderer.invoke('forms-remove-token', uuid),
    newToken: (data: TokenDto): Promise<boolean> => ipcRenderer.invoke('forms-new-token', data),
    getTokens: (): Promise<TokenDto> => ipcRenderer.invoke('forms-get-tokens'),
});

declare global {
    interface Window {
        infos: Infos;
        forms: Forms,
    }
}
