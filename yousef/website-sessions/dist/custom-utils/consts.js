"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_OUTPUT = exports.OUTPUT_FIELDS = exports.PAGE_OPENED_LOG_MESSAGE_PROPS_TO_PICK = exports.LABELS = void 0;
exports.LABELS = {
    SESSION: 'SESSION'
};
exports.PAGE_OPENED_LOG_MESSAGE_PROPS_TO_PICK = ['id'];
exports.OUTPUT_FIELDS = {
    ID: 'id',
    MEDIUM: 'medium',
    PROXY_TYPE: 'proxyType',
    PROXY_URL: 'proxyUrl',
    COOKIE: 'cookie',
    REQUEST_HEADERS: 'requestHeaders',
    WEBSITE_URL: 'websiteUrl',
    CREATION_TIME: 'creationTime'
};
exports.DEFAULT_OUTPUT = {
    [exports.OUTPUT_FIELDS.ID]: '',
    [exports.OUTPUT_FIELDS.MEDIUM]: '',
    [exports.OUTPUT_FIELDS.PROXY_TYPE]: '',
    [exports.OUTPUT_FIELDS.PROXY_URL]: '',
    [exports.OUTPUT_FIELDS.COOKIE]: '',
    [exports.OUTPUT_FIELDS.REQUEST_HEADERS]: '',
    [exports.OUTPUT_FIELDS.CREATION_TIME]: '',
    [exports.OUTPUT_FIELDS.WEBSITE_URL]: ''
};
//# sourceMappingURL=consts.js.map