import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export default class FileService<Input, Output> {
    constructor(
        private readonly filePath: string,
        private readonly fileInitialValue: string,
    ) {
        if (!existsSync(this.filePath)) {
            writeFileSync(this.filePath, this.fileInitialValue);
        }
    }

    write(value: Input) {
        const valueAsString = JSON.stringify(value);
        writeFileSync(this.filePath, valueAsString);
    }

    read(): Output {
        const output = readFileSync(this.filePath).toString();
        return JSON.parse(output);
    }
}
