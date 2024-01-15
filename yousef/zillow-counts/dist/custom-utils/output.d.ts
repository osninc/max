import { GlobalContext } from '../base-utils';
import { IFinalInput, IGlobalContextShared, IGlobalContextState } from './types';
export declare const saveData: (globalContext: GlobalContext<IFinalInput, IGlobalContextState, IGlobalContextShared>) => Promise<void>;
