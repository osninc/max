"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCounty = void 0;
const counties_json_1 = __importDefault(require("./data/counties.json"));
const getCounty = (county) => {
    const [name, stateAbbr] = county.replace(' County', '').split(', ');
    return counties_json_1.default.find((c) => c.name === name && c.state === stateAbbr);
};
exports.getCounty = getCounty;
//# sourceMappingURL=county.js.map