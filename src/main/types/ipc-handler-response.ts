export type IPCHandlerResponse<T = void> = {
    response?: T,
    error?: never;
} | {
    response?: never,
    error?: string;
}
