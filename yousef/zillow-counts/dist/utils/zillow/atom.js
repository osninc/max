"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertArea4Zillow = void 0;
const atom_1 = require("../atom");
const convertArea4Zillow = (params, searchType) => {
    let str = params.usersSearchTerm;
    if (searchType.toLowerCase() === 'zipcode') {
        // Just in case city is more than one word
        str = `${params.cityState}-${params.usersSearchTerm}`;
        return str;
    }
    const newStr = (0, atom_1.alphaNum)(str);
    return newStr.replace(/ /gi, '-').toLowerCase();
};
exports.convertArea4Zillow = convertArea4Zillow;
//# sourceMappingURL=atom.js.map