"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_OUTPUT = exports.OUTPUT_FIELDS = exports.PAGE_OPENED_LOG_MESSAGE_PROPS_TO_PICK = exports.LABELS = exports.DESTINATION = exports.WEBSITE_NAME = void 0;
exports.WEBSITE_NAME = 'Zillow';
exports.DESTINATION = {
    LOCATION_MAP_BOUNDS: 'LOCATION_MAP_BOUNDS',
    LOCATION_REGION: 'LOCATION_REGION',
    SEARCH: 'SEARCH'
};
exports.LABELS = {
    LOCATION_MAP_BOUNDS: 'LOCATION_MAP_BOUNDS',
    LOCATION_REGION: 'LOCATION_REGION',
    SEARCH: 'SEARCH'
};
exports.PAGE_OPENED_LOG_MESSAGE_PROPS_TO_PICK = ['searchUrl', 'query', 'region', 'status', 'lot', 'time'];
exports.OUTPUT_FIELDS = {
    ACREAGE: 'acreage'
};
exports.DEFAULT_OUTPUT = {
    geoSearchType: '',
    county: '',
    state: '',
    zipCode: '',
    soldInLast: '',
    daysOnZillow: ''
};
//# sourceMappingURL=consts.js.map