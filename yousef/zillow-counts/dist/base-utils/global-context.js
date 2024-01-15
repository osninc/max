"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGlobalContext = exports.GlobalContext = exports.GLOBAL_CONTEXT_KVS_RECORD_KEY = void 0;
const apify_1 = require("apify");
const general_1 = require("./general");
exports.GLOBAL_CONTEXT_KVS_RECORD_KEY = 'GLOBAL_CONTEXT_STATE';
class GlobalContext {
    constructor(options) {
        Object.defineProperty(this, "input", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "state", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "shared", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "activateSaveState", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "saveStateIntervalTimeout", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "saveStateInterval", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "log", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const { input = {}, activateSaveState = false, initialState = {}, initialSharedData = {}, saveStateIntervalTimeout = 5 * 60 * 1000 } = options;
        this.input = input;
        this.activateSaveState = activateSaveState;
        this.saveStateIntervalTimeout = saveStateIntervalTimeout;
        this.state = initialState;
        this.saveState = this.saveState.bind(this);
        this.shared = initialSharedData;
        this.log = (0, general_1.labeledLog)({ label: 'GlobalContext' });
    }
    async init() {
        if (this.activateSaveState) {
            const state = await apify_1.Actor.getValue(exports.GLOBAL_CONTEXT_KVS_RECORD_KEY);
            if (state) {
                this.state = state;
            }
            apify_1.Actor.on('migrating', this.saveState);
            apify_1.Actor.on('aborting', this.saveState);
            process.on('SIGTERM', async () => {
                await this.saveState();
                process.exit(0);
            });
            this.saveStateInterval = setInterval(this.saveState, this.saveStateIntervalTimeout);
        }
    }
    async saveState() {
        this.log.info('Saving state...');
        await apify_1.Actor.setValue(exports.GLOBAL_CONTEXT_KVS_RECORD_KEY, this.state);
        this.log.info('State saved.');
    }
    stopSavingState() {
        if (this.saveStateInterval) {
            clearInterval(this.saveStateInterval);
        }
    }
    stop() {
        if (this.activateSaveState) {
            this.stopSavingState();
        }
    }
}
exports.GlobalContext = GlobalContext;
/**
 * Create an instance of GlobalContext and initialize it.
 */
const createGlobalContext = async (options) => {
    const globalContext = new GlobalContext(options);
    await globalContext.init();
    return globalContext;
};
exports.createGlobalContext = createGlobalContext;
//# sourceMappingURL=global-context.js.map