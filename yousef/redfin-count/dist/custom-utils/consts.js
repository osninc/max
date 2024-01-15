"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_OUTPUT = exports.OUTPUT_FIELDS = exports.PAGE_OPENED_LOG_MESSAGE_PROPS_TO_PICK = exports.LABELS = exports.DESTINATION = exports.WEBSITE_NAME = void 0;
exports.WEBSITE_NAME = 'Redfin';
exports.DESTINATION = { LOCATION: 'LOCATION', SEARCH: 'SEARCH' };
exports.LABELS = {
    LOCATION: 'LOCATION',
    SEARCH: 'SEARCH'
};
exports.PAGE_OPENED_LOG_MESSAGE_PROPS_TO_PICK = ['searchUrl', 'query', 'region', 'status', 'lot', 'time'];
exports.OUTPUT_FIELDS = {
    ACREAGE: 'acreage'
};
exports.DEFAULT_OUTPUT = {
    county: '',
    state: '',
    zipCode: '',
    soldInLast: '',
    daysOnRedfin: ''
};
//# sourceMappingURL=consts.js.map