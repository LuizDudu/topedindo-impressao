import { app, Menu, BrowserWindow, Tray, dialog, ipcMain, shell } from 'electron';
// import * as PostPrinter from 'electron-pos-printer';
import path from 'path';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
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

    mainWindow.webContents.on('did-finish-load', () => {
        console.log('did-finish-load');
        mainWindow.webContents.getPrintersAsync().then((printers) => {
            console.log(printers);
            // const options = {
            //     preview: false, // Preview in window or print
            //     margin: '0 0 0 0', // margin of content body
            //     copies: 1, // Number of copies to print
            //     printerName: printers[0].name, // printerName: string, check it at webContent.getPrinters()
            //     timeOutPerLine: 400,
            //     silent: true,
            //     pageSize: '80mm',
            // };
            //
            // const data = [
            //     {
            //         type: 'text', // 'text' | 'barCode' | 'qrCode' | 'image' | 'table
            //         value: 'HEADER',
            //         style: { fontSize: '18px', textAlign: 'center' },
            //     },
            //     {
            //         type: 'text', // 'text' | 'barCode' | 'qrCode' | 'image' | 'table'
            //         value: 'Secondary text',
            //         style: { textDecoration: 'underline', fontSize: '10px', textAlign: 'center', color: 'red' },
            //     },
            //     {
            //         type: 'image',
            //         path: path.join(__dirname, 'assets/img_test.png'), // file path
            //         position: 'center', // position of image: 'left' | 'center' | 'right'
            //         width: 'auto', // width of image in px; default: auto
            //         height: '60px', // width of image in px; default: 50 or '50px'
            //     },
            //     {
            //         type: 'table',
            //         // style the table
            //         style: { border: '1px solid #ddd' },
            //         // list of the columns to be rendered in the table header
            //         tableHeader: ['Animal', 'Age'],
            //         // multi dimensional array depicting the rows and columns of the table body
            //         tableBody: [
            //             ['Cat', 2],
            //             ['Dog', 4],
            //             ['Horse', 12],
            //             ['Pig', 4],
            //         ],
            //         // list of columns to be rendered in the table footer
            //         tableFooter: ['Animal', 'Age'],
            //         // custom style for the table header
            //         tableHeaderStyle: { backgroundColor: '#000', color: 'white' },
            //         // custom style for the table body
            //         tableBodyStyle: { 'border': '0.5px solid #ddd' },
            //         // custom style for the table footer
            //         tableFooterStyle: { backgroundColor: '#000', color: 'white' },
            //     },
            //     {
            //         type: 'barCode',
            //         value: '023456789010',
            //         height: 40,                     // height of barcode, applicable only to bar and QR codes
            //         width: 2,                       // width of barcode, applicable only to bar and QR codes
            //         displayValue: true,             // Display value below barcode
            //         fontsize: 12,
            //     },
            //     {
            //         type: 'text', // 'text' | 'barCode' | 'qrCode' | 'image' | 'table
            //         value: '************************',
            //         style: { fontSize: '10px', textAlign: 'center', marginBottom: '10px' },
            //     },
            // ];
            //
            // if (options.printerName != '') {
            //     PostPrinter.print(data, options)
            //         .then(() => {
            //         })
            //         .catch((error) => {
            //             console.error(error);
            //         });
            // }
        });

        mainWindow.webContents.send('print', '<h1>Hello from the main process!</h1>');
        mainWindow.webContents.send('print', 'Hello from the main process!');


        // mainWindow.webContents.send('print', version);
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

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
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
    }
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

// Custom code //
app.whenReady().then(() => {
    const tray = new Tray(path.join(__dirname, 'icons', 'tray-icon.png'));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Configurações', type: 'normal', click: createWindow },
        { label: 'Sobre...', type: 'normal' },
        { label: 'Sair', type: 'normal', click: () => app.quit() },
    ]);

    tray.setToolTip('Topedindo - Impressão');
    tray.setContextMenu(contextMenu);
});

ipcMain.handle('get-current-version', function() {
    return app.getVersion();
});

ipcMain.handle('print', function(event) {
    console.log(event);
});
