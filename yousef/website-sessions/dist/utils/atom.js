"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomXToY = void 0;
const randomXToY = (minVal, maxVal) => {
    const randVal = minVal + Math.random() * (maxVal - minVal);
    return Math.round(randVal);
};
exports.randomXToY = randomXToY;
//# sourceMappingURL=atom.js.map