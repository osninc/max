import { IBaseFinalInput } from './types';
export declare const getSearchInfo: (input: IBaseFinalInput) => {
    geo: string;
    code: string;
};
export declare const getDatasetName: (input: IBaseFinalInput, prefix: string) => string;
export declare const DATA_SAVING_STORE_TYPE: {
    KVS: string;
    DATASET: string;
};
