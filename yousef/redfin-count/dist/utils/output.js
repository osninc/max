"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATA_SAVING_STORE_TYPE = exports.getDatasetName = exports.getSearchInfo = void 0;
const county_1 = require("./county");
const state_1 = require("./state");
const consts_1 = require("./consts");
const atom_1 = require("./atom");
const getSearchInfo = (input) => {
    const { county, searchType, state, zipCode } = input;
    let geo = '';
    let code = '';
    switch (searchType.toLowerCase()) {
        case 'state':
            geo = 'S';
            const stateItem = (0, state_1.getState)(state);
            code = stateItem?.fips ?? `NA-${state}`;
            break;
        case 'county':
            geo = 'C';
            const countyItem = (0, county_1.getCounty)(county);
            code = countyItem?.fips ?? `NA-${county}`;
            break;
        case 'zipcode':
            geo = 'Z';
            code = zipCode;
            break;
    }
    return {
        geo,
        code
    };
};
exports.getSearchInfo = getSearchInfo;
const getDatasetName = (input, prefix) => {
    const searchInfo = (0, exports.getSearchInfo)(input);
    const datasetName = (0, atom_1.getValidKVSRecordKey)(`${prefix}-${searchInfo.geo}-${searchInfo.code}-${consts_1.START_TIMESTAMP}`);
    return datasetName;
};
exports.getDatasetName = getDatasetName;
exports.DATA_SAVING_STORE_TYPE = {
    KVS: 'KVS',
    DATASET: 'DATASET'
};
//# sourceMappingURL=output.js.map