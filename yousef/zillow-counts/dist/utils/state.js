"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getState = void 0;
const states_json_1 = __importDefault(require("./data/states.json"));
const getState = (state) => {
    return states_json_1.default.find((st) => st.abbr === state);
};
exports.getState = getState;
//# sourceMappingURL=state.js.map