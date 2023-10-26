import { Actor } from 'apify'
import { Log } from 'crawlee'

import { labeledLog } from './general'

interface IGlobalContextOptions<INPUT = {}, STATE = {}, SHARED = {}> {
    input?: INPUT
    activateSaveState?: boolean
    initialState?: Partial<STATE>
    initialSharedData?: Partial<SHARED>
    saveStateIntervalTimeout?: number
}

export const GLOBAL_CONTEXT_KVS_RECORD_KEY = 'GLOBAL_CONTEXT_STATE'

const isMap = (stateEl: any) => Object.hasOwn(Object.getPrototypeOf(stateEl), 'size')

export class GlobalContext<INPUT = {}, STATE = {}, SHARED = {}> {
    input: INPUT

    state: STATE

    shared: SHARED

    private activateSaveState: boolean

    private saveStateIntervalTimeout: number

    private saveStateInterval: NodeJS.Timer | undefined

    private log: Log

    constructor(options: IGlobalContextOptions<INPUT, STATE, SHARED>) {
        const {
            input = {},
            activateSaveState = false,
            initialState = {},
            initialSharedData = {},
            saveStateIntervalTimeout = 60 * 1000
        } = options
        this.input = input as INPUT
        this.activateSaveState = activateSaveState
        this.saveStateIntervalTimeout = saveStateIntervalTimeout
        this.state = initialState as STATE
        this.saveState = this.saveState.bind(this)
        this.shared = initialSharedData as SHARED
        this.log = labeledLog({ label: 'GlobalContext' })
    }

    async init() {
        if (this.activateSaveState) {
            const state = await Actor.getValue<object>(GLOBAL_CONTEXT_KVS_RECORD_KEY)
            if (state) {
                this.state = this.transformState('load', state) as STATE
            }
            Actor.on('migrating', this.saveState)
            Actor.on('aborting', this.saveState)
            process.on('SIGTERM', async () => {
                await this.saveState()
                process.exit(0)
            })
            this.saveStateInterval = setInterval(this.saveState, this.saveStateIntervalTimeout)
        }
    }

    transformState(action: string, originalLoadedState?: any) {
        const transformedState: any = {}
        if (action === 'save') {
            const state = this.state as any
            // eslint-disable-next-line no-restricted-syntax
            for (const stateElKey of Object.keys(state)) {
                const stateEl = state[stateElKey]
                if (stateEl) {
                    let value
                    if (typeof stateEl === 'object' && isMap(stateEl)) {
                        value = Array.from((stateEl as any as Map<string, any>).entries())
                    } else {
                        value = stateEl
                    }
                    transformedState[stateElKey] = value
                }
            }
        } else {
            const state = this.state as any
            // eslint-disable-next-line no-restricted-syntax
            for (const stateElKey of Object.keys(state)) {
                const stateEl = state[stateElKey]
                const originalLoadedStateEl = originalLoadedState[stateElKey]
                if (stateEl && originalLoadedStateEl) {
                    let value
                    if (typeof stateEl === 'object' && isMap(stateEl)) {
                        value = new Map<string, any>(originalLoadedStateEl)
                    } else {
                        value = originalLoadedStateEl
                    }
                    transformedState[stateElKey] = value
                }
            }
        }
        return transformedState
    }

    async saveState() {
        this.log.info('Saving state...')
        await Actor.setValue(GLOBAL_CONTEXT_KVS_RECORD_KEY, this.transformState('save'))
        this.log.info('State saved.')
    }

    stopSavingState() {
        if (this.saveStateInterval) {
            clearInterval(this.saveStateInterval)
        }
    }

    stop() {
        if (this.activateSaveState) {
            this.stopSavingState()
        }
    }
}

/**
 * Create an instance of GlobalContext and initialize it.
 */
export const createGlobalContext = async <INPUT = {}, STATE = {}, SHARED = {}>(
    options: IGlobalContextOptions<INPUT, STATE, SHARED>
): Promise<GlobalContext<INPUT, STATE, SHARED>> => {
    const globalContext = new GlobalContext<INPUT, STATE, SHARED>(options)
    await globalContext.init()
    return globalContext
}
