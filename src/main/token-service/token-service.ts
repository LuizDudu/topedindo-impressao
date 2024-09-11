import { FileTokenDto, TokenDto } from './types';
import FileService from '../file-service/file-service';
import * as path from 'node:path';
import { app, safeStorage } from 'electron';
import WebSocketManager from '../websocket-manager/websocket-manager';
import { randomUUID } from 'crypto';
import { jwtDecode } from 'jwt-decode';

export default class TokenService {
    private readonly fileService: FileService<FileTokenDto[], FileTokenDto[]>;

    constructor() {
        const FILE_INITIAL_VALUE = '[]' as const;
        const dataPath = app.getPath('userData');
        const filePath = path.join(dataPath, 'data.json');

        this.fileService = new FileService(filePath, FILE_INITIAL_VALUE);
    }

    /**
     * @throws Error
     */
    async addToken(tokenDto: TokenDto): Promise<boolean> {
        if (!tokenDto.token) {
            return false;
        }

        if (!await WebSocketManager.isValidToken(tokenDto)) {
            throw new Error('Token inválido');
        }

        const fileData = this.fileService.read();
        const storedTokens = this.decryptFileToken(fileData);
        const hasTokenStored = storedTokens.some(storedToken => storedToken.token === tokenDto.token);

        if (hasTokenStored) {
            throw new Error('Token já cadastrado');
        }

        const payload = jwtDecode<{ lojaNome: string }>(tokenDto.token);

        const stringToEncrypt = JSON.stringify({
            uuid: randomUUID(),
            nickname: payload.lojaNome,
            token: tokenDto.token,
        });

        const buffer = safeStorage.encryptString(stringToEncrypt);
        const bufferAsString = buffer.join();

        fileData.push({
            token: bufferAsString,
        });

        this.fileService.write(fileData);

        return true;
    }

    getTokens(): TokenDto[] {
        const fileData = this.fileService.read();

        return this.decryptFileToken(fileData);
    }

    removeToken(uuid: string): TokenDto {
        let fileData = this.fileService.read();
        const tokens = this.decryptFileToken(fileData);

        const index = tokens.findIndex(tokenDto => tokenDto.uuid === uuid);
        if (index === -1) {
            throw new Error('Token não existe');
        }

        const token = tokens[index];
        tokens.splice(index, 1);
        fileData = tokens.map((tokenDto): FileTokenDto => {
            const stringToEncrypt = JSON.stringify(tokenDto);

            const buffer = safeStorage.encryptString(stringToEncrypt);
            const bufferAsString = buffer.join();

            return {
                token: bufferAsString
            }
        })

        this.fileService.write(fileData);
        return token;
    }

    private decryptFileToken(fileTokenDtos: FileTokenDto[]): TokenDto[] {
        return fileTokenDtos.map(fileTokenDto => {
            const tokenAsBuffer = Buffer.from(fileTokenDto.token.split(',').map(Number));
            return JSON.parse(safeStorage.decryptString(tokenAsBuffer)) as TokenDto;
        });
    }
}
