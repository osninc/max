export declare const validators: {
    browserPage: (value: string) => {
        validator: boolean;
        message: (label: string) => string;
    };
    proxyConfiguration: (value: string) => {
        validator: boolean;
        message: (label: string) => string;
    };
    requestList: (value: string) => {
        validator: boolean;
        message: (label: string) => string;
    };
    requestQueue: (value: string) => {
        validator: boolean;
        message: (label: string) => string;
    };
    pseudoUrl: (value: string) => {
        validator: boolean;
        message: (label: string) => string;
    };
};
