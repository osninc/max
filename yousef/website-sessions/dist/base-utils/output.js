"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.persistDownloadLink = void 0;
const apify_1 = require("apify");
const crawlee_1 = require("crawlee");
const general_1 = require("./general");
const persistDownloadLink = async ({ completeOutputExample, pushHeadersAsItem = false, forceCreation = false, fileFormat = 'xlsx' }) => {
    const log = (0, general_1.labeledLog)({ label: 'Output' });
    let dataFileUrl = `local.${fileFormat}`;
    if (apify_1.Actor.isAtHome()) {
        const { defaultDatasetId } = apify_1.Actor.getEnv();
        const fields = Object.keys(completeOutputExample).join(',');
        // eslint-disable-next-line max-len
        dataFileUrl = `https://api.apify.com/v2/datasets/${defaultDatasetId}/items?attachment=true&clean=true&format=${fileFormat}&fields=${encodeURIComponent(fields)}`;
        log.info(`You can download the dataset data file here: ${dataFileUrl}`);
    }
    if (!(await crawlee_1.KeyValueStore.getValue('DOWNLOAD_LINK')) || forceCreation) {
        await crawlee_1.KeyValueStore.setValue('DOWNLOAD_LINK', { dataFileUrl });
        if (pushHeadersAsItem) {
            const headers = {};
            Object.keys(completeOutputExample).forEach((key) => {
                headers[key] = key;
            });
            await crawlee_1.Dataset.pushData([headers]);
        }
    }
};
exports.persistDownloadLink = persistDownloadLink;
//# sourceMappingURL=output.js.map