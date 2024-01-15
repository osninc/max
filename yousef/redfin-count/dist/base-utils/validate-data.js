"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateData = void 0;
const crawlee_1 = require("crawlee");
const general_1 = require("./general");
const validateData = async (params) => {
    const { assumedItemsNumber, minAssumedItemsNumber = 0, maxErrorsMarginPercent = 10 } = params;
    const log = (0, general_1.labeledLog)({ label: 'DataValidation' });
    if (assumedItemsNumber < minAssumedItemsNumber) {
        throw new Error(
        // eslint-disable-next-line max-len
        `Parameter "assumedItemsNumber" must be greater than ${minAssumedItemsNumber}. Provided value was: ${assumedItemsNumber}`);
    }
    await (0, crawlee_1.sleep)(10 * 1000);
    const dataset = await crawlee_1.Dataset.open();
    const datasetInfo = await dataset.getInfo();
    const cleanItemsCount = datasetInfo ? datasetInfo.cleanItemCount || datasetInfo.itemCount : 0;
    const cleanItemsPercent = +((cleanItemsCount * 100) / assumedItemsNumber).toFixed(2);
    const errorsMarginPercent = 100 - cleanItemsPercent;
    const statistics = {
        assumedItemsNumber,
        cleanItemsCount,
        cleanItemsPercent,
        errorsMarginPercent,
        maxErrorsMarginPercent
    };
    log.info('Statistics:', statistics);
    if (errorsMarginPercent > maxErrorsMarginPercent) {
        throw new Error(`We didn't get all the assumed items ${JSON.stringify(statistics)})`);
    }
};
exports.validateData = validateData;
//# sourceMappingURL=validate-data.js.map