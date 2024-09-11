// import { PosPrintData } from 'electron-pos-printer';
import { PosPrintData } from '@plick/electron-pos-printer';

export interface PrintDetailsResponse {
    pedidoId: string
    toPrint: PrintDetailsResponseToPrint
}

export interface PrintDetailsResponseToPrint {
    data: PosPrintData[],
    titulo: string
    texto: string
    produtos: Produtos
    alinhamentoTitulo: string
    alinhamentoTexto: string
    tamanhoTitulo: string
    tamanhoTexto: string
    expessuraTitulo: string
    expessuraTexto: string
    options: ToPrintResponseOptions
}

export interface Produtos {
    type: string
    style: Style
    tableHeader: string[]
    tableBody: string[][]
    tableFooter: string[]
    tableHeaderStyle: TableHeaderStyle
    tableBodyStyle: TableBodyStyle
    tableFooterStyle: TableFooterStyle
}

export interface Style {
    border: string
}

export interface TableHeaderStyle {
    color: string
}

export interface TableBodyStyle {
    border: string
    fontWeight: string
    fontSize: string
}

export interface TableFooterStyle {
    color: string
}

export interface ToPrintResponseOptions {
    margem: string
    copias: number
    impressora: string
    tamanhoPagina: string
    dpi: {
        vertical: number
        horizontal: number
    }
}
