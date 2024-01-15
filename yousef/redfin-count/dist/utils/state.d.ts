export declare const getState: (state: string) => {
    name: string;
    metaphones: string[];
    statehood_year: number;
    ap_abbr: string;
    is_territory: boolean;
    fips: string;
    abbr: string;
    capital: string;
    capital_tz: string;
    time_zones: string[];
} | {
    name: string;
    metaphones: string[];
    statehood_year: null;
    ap_abbr: null;
    is_territory: boolean;
    fips: string;
    abbr: string;
    capital: string;
    capital_tz: string;
    time_zones: string[];
} | {
    name: string;
    metaphones: string[];
    statehood_year: null;
    ap_abbr: string;
    is_territory: boolean;
    fips: string;
    abbr: string;
    capital: null;
    capital_tz: string;
    time_zones: string[];
} | undefined;
