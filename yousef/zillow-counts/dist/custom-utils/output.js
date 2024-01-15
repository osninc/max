"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveData = void 0;
const apify_1 = require("apify");
const lodash_1 = __importDefault(require("lodash"));
const utils_1 = require("../utils");
const base_utils_1 = require("../base-utils");
const output_1 = require("../utils/output");
const consts_1 = require("./consts");
const saveData = async (globalContext) => {
    const log = (0, base_utils_1.labeledLog)({ label: 'saveData' });
    const { timeTracker } = globalContext.shared;
    const { dataSavingStoreType } = globalContext.input;
    const logInfo = { dataSavingStoreType };
    log.info('Saving started', logInfo);
    const { searchCount, searchResults } = globalContext.state;
    const totalResults = searchResults.length;
    const totalNA = searchCount !== searchResults.length
        ? searchCount - searchResults.length
        : searchResults.filter((data) => data.count === 'N/A').length;
    // @ts-ignore
    const failureRate = totalResults ? `${(totalNA / totalResults).toFixed(2) * 100} %` : '100 %';
    let secDiff;
    let estimatedCost;
    let datasetId = null;
    if (apify_1.Actor.isAtHome()) {
        const { actorRunId, defaultDatasetId } = apify_1.Actor.getEnv();
        datasetId = defaultDatasetId;
        const actorRun = await apify_1.Actor.apifyClient.run(actorRunId ?? '').get();
        if (actorRun) {
            secDiff = actorRun.stats.runTimeSecs;
            estimatedCost = actorRun.stats.computeUnits;
        }
        else {
            secDiff = 0;
            estimatedCost = 0;
        }
    }
    else {
        secDiff = timeTracker.stop(utils_1.TimeTrackGeneralNames.RUN_DURATION);
        const howMany10Seconds = parseInt(`${secDiff / 10}`, 10);
        estimatedCost = (howMany10Seconds === 0 ? 1 : howMany10Seconds) * 0.001;
    }
    secDiff += 4;
    estimatedCost += 4;
    const estimatedCostStr = `$${estimatedCost?.toFixed(3)}`;
    const totalRunTime = `${secDiff.toFixed(2)} seconds`;
    const { start: smartproxyConsumptionStart, stop: smartproxyConsumptionStop } = globalContext.state.smartproxyConsumption ?? {};
    const smartproxyConsumption = smartproxyConsumptionStart && smartproxyConsumptionStop
        ? `${smartproxyConsumptionStop - smartproxyConsumptionStart} GB`
        : '';
    const outputData = [
        {
            proxyType: globalContext.input.proxyType,
            scraper: globalContext.input.scraper,
            area: (0, utils_1.getSearchQuery)(globalContext.input),
            total: totalResults,
            totalFailed: totalNA,
            failureRate,
            estimatedCost: estimatedCostStr,
            totalRunTime,
            smartproxyConsumption,
            datasetId
        },
        ...lodash_1.default.orderBy(searchResults, ['status', 'soldInLast', 'daysOnZillow', 'acreage'], ['asc', 'asc', 'asc', 'asc'])
    ];
    if (dataSavingStoreType === output_1.DATA_SAVING_STORE_TYPE.KVS) {
        await apify_1.Actor.setValue('OUTPUT', outputData);
    }
    else {
        await apify_1.Actor.pushData([
            ...outputData
            // ...orderSearchResults(searchResults)
        ]);
    }
    if (apify_1.Actor.isAtHome() && dataSavingStoreType === output_1.DATA_SAVING_STORE_TYPE.DATASET) {
        const { defaultDatasetId } = apify_1.Actor.getEnv();
        if (defaultDatasetId) {
            const datasetName = (0, output_1.getDatasetName)(globalContext.input, consts_1.WEBSITE_NAME);
            log.info('Updating dataset name', { ...logInfo, datasetName });
            await apify_1.Actor.apifyClient.dataset(defaultDatasetId).update({
                name: datasetName
            });
        }
    }
    log.info('Saving finished', { ...logInfo, itemCount: outputData.length });
};
exports.saveData = saveData;
//# sourceMappingURL=output.js.map