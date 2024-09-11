import * as path from 'path';
import { app, BrowserWindow, dialog, ipcMain, Menu, PrinterInfo, shell, Tray } from 'electron';
import { ShowDialogDto } from './preload';
import WebSocketManager from './main/websocket-manager/websocket-manager';
import { TokenDto } from './main/token-service/types';
import TokenService from './main/token-service/token-service';
import { IPCHandlerResponse } from './main/types/ipc-handler-response';
import { updateElectronApp } from 'update-electron-app';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

let tokenService: TokenService = null;
let mainWindow: BrowserWindow = null;
let wsManager: WebSocketManager = null;

const createMainWindow = async () => {
    // Create the browser window.
    if (mainWindow && !mainWindow.isDestroyed()) {
        return;
    }

    mainWindow = new BrowserWindow({
        icon: path.join(__dirname, 'icons', 'tray-icon.png'),
        autoHideMenuBar: true,
        width: 800,
        height: 600,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    mainWindow.webContents.on('did-finish-load', async () => {
    });

    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();
    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
    });

    mainWindow.on('close', function() {
        mainWindow.removeAllListeners('close');
        mainWindow = null;

        const result: number = dialog.showMessageBoxSync(null, {
            title: 'Sair',
            message: 'Deseja minimizar para bandeja?',
            buttons: ['Sim', 'Fechar'],
        });

        if (result === 0) {
            return;
        }

        if (process.platform !== 'darwin') {
            app.quit();
            return;
        }
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        // createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

app.whenReady().then(async () => {
    if (!app.requestSingleInstanceLock()) {
        app.quit();
    }

    updateElectronApp();
    wsManager = new WebSocketManager();
    tokenService = new TokenService();
    const tokens = tokenService.getTokens();
    const printers = await getPrintersAvaiable();

    if (tokens.length === 0) {
        await createMainWindow();
    } else {
        dialog.showMessageBox(null, {
            type: 'info',
            message: 'Aplicativo abriu na bandeja do sistema',
        });

        for (const token of tokens) {
            const conectou = wsManager.createConnection(token.token, printers);
            console.log('conectou', conectou);
        }
    }

    const tray = new Tray(path.join(__dirname, 'icons', 'tray-icon.png'));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Configurações', type: 'normal', click: createMainWindow },
        { label: 'Sobre...', type: 'normal' },
        { label: 'Sair', type: 'normal', click: () => app.quit() },
    ]);

    tray.setToolTip('topedindo - Impressão');
    tray.on('click', createMainWindow);
    tray.setContextMenu(contextMenu);
});

async function getPrintersAvaiable(): Promise<PrinterInfo[]> {
    let hiddenWindow: BrowserWindow = new BrowserWindow({
        type: 'hidden',
        show: false,
        height: 0,
        width: 0,
    });

    const printers = await hiddenWindow.webContents.getPrintersAsync();

    hiddenWindow = null;

    return printers;
}

ipcMain.handle('get-current-version', function() {
    return app.getVersion();
});

ipcMain.handle('forms-new-token', async function(event, tokenDto: TokenDto): Promise<IPCHandlerResponse<boolean>> {
    try {
        const success = await tokenService.addToken(tokenDto);
        if (success) {
            wsManager.createConnection(tokenDto.token, await getPrintersAvaiable());
        }

        return {
            response: true,
        };
    } catch (error) {
        return {
            error: error.message as string,
        };
    }
});

ipcMain.handle('forms-remove-token', async function(event, uuid: string): Promise<IPCHandlerResponse<void>> {
    try {
        const removedToken = tokenService.removeToken(uuid);
        wsManager.closeConnection(removedToken.token);
        return;
    } catch (err) {
        return {
            error: err.message as string,
        };
    }
});

ipcMain.handle('forms-get-tokens', function() {
    const tokens = tokenService.getTokens();
    const formTokens: TokenDto[] = [];

    for (const token of tokens) {
        token.token = '*********';
        formTokens.push(token);
    }

    return formTokens;
});

ipcMain.handle('show-dialog', (event, data: ShowDialogDto) => {
    const result: number = dialog.showMessageBoxSync(null, {
        type: data.type,
        title: data.title,
        message: data.message,
        buttons: data.buttons,
    });

    return result;
});
