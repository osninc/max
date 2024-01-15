interface IGlobalContextOptions<INPUT = {}, STATE = {}, SHARED = {}> {
    input?: INPUT;
    activateSaveState?: boolean;
    initialState?: Partial<STATE>;
    initialSharedData?: Partial<SHARED>;
    saveStateIntervalTimeout?: number;
}
export declare const GLOBAL_CONTEXT_KVS_RECORD_KEY = "GLOBAL_CONTEXT_STATE";
export declare class GlobalContext<INPUT = {}, STATE = {}, SHARED = {}> {
    input: INPUT;
    state: STATE;
    shared: SHARED;
    private activateSaveState;
    private saveStateIntervalTimeout;
    private saveStateInterval;
    private log;
    constructor(options: IGlobalContextOptions<INPUT, STATE, SHARED>);
    init(): Promise<void>;
    saveState(): Promise<void>;
    stopSavingState(): void;
    stop(): void;
}
/**
 * Create an instance of GlobalContext and initialize it.
 */
export declare const createGlobalContext: <INPUT = {}, STATE = {}, SHARED = {}>(options: IGlobalContextOptions<INPUT, STATE, SHARED>) => Promise<GlobalContext<INPUT, STATE, SHARED>>;
export {};
