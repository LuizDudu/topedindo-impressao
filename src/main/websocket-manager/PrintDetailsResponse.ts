import { PosPrintData } from '@plick/electron-pos-printer';

export interface PrintDetailsResponse {
    pedidoId: string;
    toPrint: PrintDetailsResponseToPrint;
}

export interface PrintDetailsResponseToPrint {
    data: PosPrintData[],
    options: ToPrintResponseOptions
}

export interface ToPrintResponseOptions {
    margem: string;
    copias: number;
    impressora: string;
    tamanhoPagina: string;
    dpi: {
        vertical: number
        horizontal: number
    };
}
