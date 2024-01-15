interface ILocationManagerOptions {
    activateCaching?: boolean;
    kvsName?: string;
}
export declare const LOCATION_MANAGER_KVS_NAME = "land-stats-locations";
export declare class LocationManager {
    private activateCaching;
    private kvsName;
    private log;
    private kvs;
    constructor(options: ILocationManagerOptions);
    init(): Promise<void>;
    cacheLocation(key: string, data: any): Promise<void>;
    loadLocation(key: string): Promise<unknown>;
}
/**
 * Create an instance of LocationManager and initialize it.
 */
export declare const createLocationManager: (options?: ILocationManagerOptions) => Promise<LocationManager>;
export {};
