import { KeyValueStore } from 'apify'
import { Log } from 'crawlee'

import { labeledLog } from '../base-utils'

interface ILocationManagerOptions {
    activateCaching?: boolean
}

export const LOCATION_MANAGER_KVS_NAME = 'redfin-location'

export class LocationManager {
    private activateCaching: boolean

    private log: Log

    private kvs: KeyValueStore | undefined

    constructor(options: ILocationManagerOptions) {
        const { activateCaching = true } = options
        this.activateCaching = activateCaching
        this.log = labeledLog({ label: 'LocationManager' })
    }

    async init() {
        if (this.activateCaching) {
            this.kvs = await KeyValueStore.open(LOCATION_MANAGER_KVS_NAME)
        }
    }

    async cacheLocation(key: string, data: any) {
        this.log.info('Caching location...')
        await this.kvs?.setValue(key, data)
        this.log.info('Location cached.')
    }

    async loadLocation(key: string) {
        this.log.info('Loading location...')
        const location = await this.kvs?.getValue(key)
        this.log.info('Location loaded.')
        return location
    }
}

/**
 * Create an instance of LocationManager and initialize it.
 */
export const createLocationManager = async (options?: ILocationManagerOptions): Promise<LocationManager> => {
    const locationManager = new LocationManager(options ?? {})
    await locationManager.init()
    return locationManager
}
