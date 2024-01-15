import { RequestObjectArray } from '../base-utils';
import { IFinalInput, IInput } from './types';
export declare const validateInput: (input: IInput) => void;
export declare const prepareStartSessionRequests: (input: IFinalInput) => RequestObjectArray;
