"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareStartSessionRequests = exports.validateInput = void 0;
const base_utils_1 = require("../base-utils");
const consts_1 = require("./consts");
const validateInput = (input) => {
    const { extraBlockFunc: extraBlockFuncStr } = input;
    const extraBlockFunc = extraBlockFuncStr ? eval(extraBlockFuncStr) : undefined;
    void extraBlockFunc;
};
exports.validateInput = validateInput;
const prepareStartSessionRequests = (input) => {
    const { websiteUrl, maxSessions = 10, medium, proxyType } = input;
    const requests = [];
    for (let i = 0; i < maxSessions; i++) {
        const id = `${i}`;
        requests.push({
            url: websiteUrl,
            uniqueKey: (0, base_utils_1.getValidKey)(`${consts_1.LABELS.SESSION}_${id}`),
            userData: {
                label: consts_1.LABELS.SESSION,
                id,
                websiteUrl,
                medium,
                proxyType
            },
            skipNavigation: true
        });
    }
    return requests;
};
exports.prepareStartSessionRequests = prepareStartSessionRequests;
//# sourceMappingURL=general.js.map