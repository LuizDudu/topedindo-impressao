import { io, Socket } from 'socket.io-client';
import { PrinterInfo } from 'electron';
import { AccessToken, WsServer } from './types';
import { PrintDetailsResponse } from './PrintDetailsResponse';
import { TokenDto } from '../token-service/types';
import { PosPrinter, PosPrintOptions } from '@plick/electron-pos-printer';

export default class WebSocketManager {
    private static wsServer: WsServer;
    private readonly connections: Map<AccessToken, Socket>;

    constructor() {
        WebSocketManager.wsServer = {
            ssl: true,
            url: 'api.topedin.do',
            namespace: 'impressoes',
        };

        this.connections = new Map();
    }

    static async isValidToken(tokenDto: TokenDto): Promise<boolean> {
        let socket = WebSocketManager.getNewSocket(tokenDto.token);

        return new Promise((resolve) => {
            socket.on('connect', () => {
                const connected = getConnectionStatus(socket);
                socket = null;
                resolve(connected);
            });

            socket.on('connect_error', () => {
                const connected = getConnectionStatus(socket);
                socket = null;
                resolve(connected);
            });
        });

        function getConnectionStatus(socket: Socket): boolean {
            const connected = socket.connected;
            socket.disconnect();
            return connected;
        }
    }

    createConnection(accessToken: AccessToken, printers: PrinterInfo[]): boolean {
        const socket = WebSocketManager.getNewSocket(accessToken);

        const printersToSend = printers.map(printer => ({ name: printer.name, displayName: printer.displayName }));

        socket.on('connect', () => {
            socket.emit('setPrinters', printersToSend, (err: any) => console.log(err));
        });

        socket.on('printDetails', (printDetailsResponse: PrintDetailsResponse) => {
            const posPrintOptions: PosPrintOptions = {
                silent: true,
                boolean: true,
                preview: false,
                margin: printDetailsResponse.toPrint.options.margem,
                timeOutPerLine: 400,
                copies: printDetailsResponse.toPrint.options.copias,
                printerName: printDetailsResponse.toPrint.options.impressora,
                pageSize: {
                    height: 1200,
                    width: parseMilimeterToPixel(parseInt(printDetailsResponse.toPrint.options.tamanhoPagina)),
                },
            };

            PosPrinter.print(printDetailsResponse.toPrint.data, posPrintOptions)
                .then(console.log)
                .catch((error) => {
                    console.error(error);
                });
        });

        socket.on('connect_error', (err: any) => {
            setTimeout(() => socket.connect(), 2000);
        });

        this.connections.set(accessToken, socket);
        return true;

        function parseMilimeterToPixel(mm: number): number {
            const pixels = mm / 0.2645833333;
            const result = pixels.toFixed(2);
            return parseFloat(result);
        }
    }

    getConnection(accessToken: AccessToken): Socket | null {
        const connection = this.connections.get(accessToken);
        if (!connection) {
            return null;
        }

        return connection;
    }

    getConnectionsByStatus(status: 'connected' | 'not_connected'): Socket[] {
        const connections: Socket[] = [];
        for (const [id, connection] of this.connections.entries()) {
            if (status === 'connected' && connection.connected) {
                connections.push(connection);
                continue;
            }

            if (status === 'not_connected' && !connection.connected) {
                connections.push(connection);
            }
        }

        return connections;
    }

    public closeConnection(accessToken: AccessToken): boolean {
        const connection = this.connections.get(accessToken);
        connection.disconnect();
        this.connections.delete(accessToken);

        return true;
    }

    private static getNewSocket(accessToken: AccessToken, autoConnect = true): Socket {
        const url = `${WebSocketManager.wsServer.url}/${WebSocketManager.wsServer.namespace}`;
        let fullUrl;

        if (WebSocketManager.wsServer.ssl === true) {
            fullUrl = `wss://${url}`;
        } else {
            fullUrl = `ws://${url}`;
        }

        return io(fullUrl, {
            autoConnect: autoConnect,
            transports: ['websocket'],
            extraHeaders: {
                'Authorization': 'Bearer ' + accessToken,
            },
        });
    }
}
