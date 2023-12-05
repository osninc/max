export const BUILD = 'yir-dev';

export const ACTORS = {
    ZILLOW: {
        ACTIVE: true,
        COUNT: {
            BUILD: 'yir-dev',
            ID: 'OVT9EXRpZMjSZ2lhS',
            IGNORECOUNTFILTER: false,
            CONVERTACREAGE: false,
            RENAMEFIELDS: {
                daysOnZillow: 'daysOn',
            },
            COMBINE: false,
        },
        DETAILS: {
            BUILD: BUILD,
            ID: 'cFgGRlqgcB99RCBE5',
            GRAPHQL: 'https://www.zillow.com/graphql',
        },
        SHOWDISCLAIMER: true, // This is the disclaimer aabout zillow only showing maximum 500 details
    },
    REDFIN: {
        ACTIVE: true,
        COUNT: {
            BUILD: 'yir-dev',
            ID: 'Q6imaQAKtun38uOho',
            IGNORECOUNTFILTER: true,
            CONVERTACREAGE: true,
            RENAMEFIELDS: {
                // The key would be the what exists in the JSON, and the value is what we have the new key to be
                daysOnRedfin: 'daysOn',
                count: 'agentCount',
            },
            COMBINE: false,
            COMBINE2: {
                ACREAGE: {
                    ['0-1']: [
                        '0-0',
                        '0-0.05',
                        '0.1-0.15',
                        '0.05-0.1',
                        '0.5-1',
                        '0.15-0.18',
                        '0.18-0.22',
                        '0.22-0.25',
                        '0.25-0.5',
                    ],
                    // eslint-disable-next-line prettier/prettier
                    ['2-5']: [
                        '2-3',
                        '3-4',
                        '4-5'
                    ],
                    // eslint-disable-next-line prettier/prettier
                    ['100+']: [
                        '100-0'
                    ]
                },
                STATUS: {
                    // eslint-disable-next-line prettier/prettier
                    ['7 days']: [
                        '1 day', '1 week', '3 days'
                    ],
                    // eslint-disable-next-line prettier/prettier
                    ['30 days']: [
                        '1 month', '14 days'
                    ],
                    // eslint-disable-next-line prettier/prettier
                    ['90 days']: [
                        '3 months', '45 days'
                    ],
                    // eslint-disable-next-line prettier/prettier
                    ['12 months']: [
                        '1 year'
                    ],
                    // eslint-disable-next-line prettier/prettier
                    ['24 months']: [
                        '2 years'
                    ],
                    // eslint-disable-next-line prettier/prettier
                    ['36 months']: [
                        '3 years'
                    ]
                },
            },
        },
        DETAILS: {
            BUILD: BUILD,
            ID: '',
            GRAPHQL: '',
        },
        SHOWDISCLAIMER: false,
    },
    REALTOR: {
        ACTIVE: false,
        COUNT: {
            BUILD: BUILD,
            ID: 'eluFxHcr2G7Z3pzO8',
            IGNORECOUNTFILTER: false,
            RENAMEFIELDS: [],
            COMBINE: false,
        },
        DETAILS: {
            BUILD: BUILD,
            ID: '',
            GRAPHQL: '',
        },
        INVENTORY: {
            BUILD: BUILD,
            ID: 'eluFxHcr2G7Z3pzO8',
        },
        SHOWDISCLAIMER: false,
    },
    LANDWATCH: {
        ACTIVE: false,
        COUNT: {
            COMBINE: false,
        },
        DETAILS: {},
        SHOWDISCLAIMER: false,
    },
    // MLS: {
    //     ACTIVE: false,
    //     COUNT: {
    //         COMBINE: false
    //     },
    //     DETAILS: {

    //     },
    //     SHOWDISCLAIMER: false
    // }
};

export const DEBUGMENU = {
    // eslint-disable-next-line prettier/prettier
    SCRAPER: [
        'AXIOS',
        'CRAWLEE_SEND_REQUEST'
    ],
    // eslint-disable-next-line prettier/prettier
    PROXYTYPE: [
        'SMARTPROXY_RESIDENTIAL',
        'APIFY_RESIDENTIAL',
        'SMARTPROXY_DATACENTER',
        'APIFY_DATACENTER'
    ],
    // eslint-disable-next-line prettier/prettier
    DATASTORETYPE: [
        'DATASET',
        'KVS'
    ]
};

export const APIFY = {
    TOKEN: 'apify_api_eVR6ZxQGjhIbayqnfEDxPwGa8p4EF61kQe2H',
    BASEURL: 'https://api.apify.com/v2',
    ENDPOINTS: {
        NEW: '/acts/<ACTORID>/run-sync-get-dataset-items?build=<BUILD>',
        DATASETINFO: '/datasets/<DATASETID>/?',
        DATASETS: '/datasets/<DATASETID>/items/?',
        INPUT: '/key-value-stores/<STOREID>/records/INPUT/?',
        RUNS: '/acts/<ACTORID>/runs/?&desc=true',
        LASTDATASET: '/acts/<ACTORID>/runs/last/dataset/items?',
    },
    NETR: 'https://api.apify.com/v2/acts/T7PVYo0sUSJ6XBnw6/runs/last/dataset/items?token=apify_api_eVR6ZxQGjhIbayqnfEDxPwGa8p4EF61kQe2H',
    PASTDAYS: 7,
};

export const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 900,
    height: '100%',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    overflow: 'scroll',
};

export const srcset = (image, width, height, rows = 1, cols = 1) => {
    return {
        src: `${image}?w=${width * cols}&h=${height * rows}&fit=crop&auto=format`,
        srcSet: `${image}?w=${width * cols}&h=${height * rows}&fit=crop&auto=format&dpr=2 2x`,
    };
};

export const SOURCE = {
    zillow: {
        color: '#1277e1',
        mapMarkerBorder: 'blue',
    },
    redfin: {
        color: '#a02021',
        mapMarkerBorder: 'red',
    },
    realtor: {
        color: '#b76e79',
    },
    landwatch: {
        color: 'aaa',
    },
    mls: {
        color: 'blue',
    },
};

export const tableHeaderStyle = {
    backgroundColor: 'black',
    color: 'white',
};

export const iconButtonFAStyle = {
    paddingRight: 5,
};
