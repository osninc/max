"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSearchQuery = void 0;
const getSearchQuery = (input) => {
    const { county, searchType, state, zipCode } = input;
    let query = county;
    switch (searchType.toLowerCase()) {
        case 'zipcode':
            query = zipCode;
            break;
        case 'state':
            query = state;
            break;
    }
    return query;
};
exports.getSearchQuery = getSearchQuery;
//# sourceMappingURL=input.js.map