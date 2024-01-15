"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLocationManager = exports.LocationManager = exports.LOCATION_MANAGER_KVS_NAME = void 0;
const apify_1 = require("apify");
const base_utils_1 = require("../base-utils");
exports.LOCATION_MANAGER_KVS_NAME = 'land-stats-locations';
class LocationManager {
    constructor(options) {
        Object.defineProperty(this, "activateCaching", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "kvsName", {
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
        Object.defineProperty(this, "kvs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const { activateCaching = true, kvsName = exports.LOCATION_MANAGER_KVS_NAME } = options;
        this.activateCaching = activateCaching;
        this.kvsName = kvsName;
        this.log = (0, base_utils_1.labeledLog)({ label: 'LocationManager' });
    }
    async init() {
        if (this.activateCaching) {
            this.kvs = await apify_1.KeyValueStore.open(this.kvsName);
        }
    }
    async cacheLocation(key, data) {
        this.log.info('Caching location...');
        await this.kvs?.setValue(key, data);
        this.log.info('Location cached.');
    }
    async loadLocation(key) {
        this.log.info('Loading location...');
        const location = await this.kvs?.getValue(key);
        this.log.info('Location loaded.');
        return location;
    }
}
exports.LocationManager = LocationManager;
/**
 * Create an instance of LocationManager and initialize it.
 */
const createLocationManager = async (options) => {
    const locationManager = new LocationManager(options ?? {});
    await locationManager.init();
    return locationManager;
};
exports.createLocationManager = createLocationManager;
//# sourceMappingURL=location-manager.js.map