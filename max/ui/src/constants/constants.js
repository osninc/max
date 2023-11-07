export const BUILD = "yir-dev";
export const STARTDETAILSACTOR = false;

export const ACTORS = {
    ZILLOW: {
        ACTIVE: true,
        COUNT: {
            BUILD: "0.1.52",
            ID: "OVT9EXRpZMjSZ2lhS",
            IGNORECOUNTFILTER: false,
            CONVERTACREAGE: false,
            RENAMEFIELDS: {
                daysOnZillow: "daysOn"
            },
            COMBINE: false
        },
        DETAILS: {
            BUILD: BUILD,
            ID: "cFgGRlqgcB99RCBE5",
            GRAPHQL: "https://www.zillow.com/graphql"
        },
        SHOWDISCLAIMER: true // This is the disclaimer aabout zillow only showing maximum 500 details
    },
    REDFIN: {
        ACTIVE: true,
        COUNT: {
            BUILD: "0.1.11",
            ID: "Q6imaQAKtun38uOho",
            IGNORECOUNTFILTER: true,
            CONVERTACREAGE: true,
            RENAMEFIELDS: {// The key would be the what exists in the JSON, and the value is what we have the new key to be
                daysOnRedfin: "daysOn",
                count: "agentCount"
            },
            COMBINE: {
                ACREAGE: {
                    ["0-1"]: [
                        "0-0",
                        "0-0.05",
                        "0.1-0.15",
                        "0.05-0.1",
                        "0.5-1",
                        "0.15-0.18",
                        "0.18-0.22",
                        "0.22-0.25",
                        "0.25-0.5"
                    ],
                    ["2-5"]: [
                        "2-3", "3-4", "4-5"
                    ],
                    ["100+"]: [
                        "100-0"
                    ]
                },
                STATUS: {
                    ["7 days"]: [
                        "1 day", "1 week", "3 days"
                    ],
                    ["30 days"]: [
                        "1 month", "14 days"
                    ],
                    ["90 days"]: [
                        "3 months", "45 days"
                    ],
                    ["12 months"]: [
                        "1 year"
                    ],
                    ["24 months"]: [
                        "2 years"
                    ],
                    ["36 months"]: [
                        "3 years"
                    ]
                }
            }

        },
        DETAILS: {
            BUILD: BUILD,
            ID: "",
            GRAPHQL: ""
        },
        SHOWDISCLAIMER: false
    },
    REALTOR: {
        ACTIVE: false,
        COUNT: {
            BUILD: BUILD,
            ID: "eluFxHcr2G7Z3pzO8",
            IGNORECOUNTFILTER: false,
            RENAMEFIELDS: [],
            COMBINE: false
        },
        DETAILS: {
            BUILD: BUILD,
            ID: "",
            GRAPHQL: ""
        },
        SHOWDISCLAIMER: false
    },
    LANDWATCH: {
        ACTIVE: false,
        COUNT: {
            COMBINE: false
        },
        DETAILS: {

        },
        SHOWDISCLAIMER: false
    },
    MLS: {
        ACTIVE: false,
        COUNT: {
            COMBINE: false
        },
        DETAILS: {

        },
        SHOWDISCLAIMER: false
    }
}

export const DEBUGMENU = {
    SCRAPER: [
        "AXIOS",
        "CRAWLEE_SEND_REQUEST"
    ],
    PROXYTYPE: [
        "SMARTPROXY_RESIDENTIAL",
        "APIFY_RESIDENTIAL",
        "SMARTPROXY_DATACENTER",
        "APIFY_DATACENTER"
    ],
    DATASTORETYPE: [
        "DATASET",
        "KVS"
    ]
}

export const APIFY = {
    TOKEN: "apify_api_eVR6ZxQGjhIbayqnfEDxPwGa8p4EF61kQe2H",
    BASEURL: "https://api.apify.com/v2",
    ENDPOINTS: {
        NEW: "/acts/<ACTORID>/run-sync-get-dataset-items?build=<BUILD>",
        DATASETS: "/datasets/<DATASETID>/items/?",
        INPUT: "/key-value-stores/<STOREID>/records/INPUT/?",
        RUNS: "/acts/<ACTORID>/runs/?&desc=true"
    },
    PASTDAYS: 7
}

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
    overflow: 'scroll'
};

export const srcset = (image, width, height, rows = 1, cols = 1) => {
    return {
        src: `${image}?w=${width * cols}&h=${height * rows}&fit=crop&auto=format`,
        srcSet: `${image}?w=${width * cols}&h=${height * rows
            }&fit=crop&auto=format&dpr=2 2x`,
    };
}

export const SOURCE = {
    zillow: {
        color: "#1277e1",
        mapMarkerBorder: "blue"
    },
    redfin: {
        color: "#a02021",
        mapMarkerBorder: "red"
    },
    realtor: {
        color: "#b76e79"
    },
    landwatch: {
        color: "aaa"
    },
    mls: {
        color: "blue"
    }
}

export const tableHeaderStyle = {
    backgroundColor: "black",
    color: "white"
}

export const iconButtonFAStyle = {
    paddingRight: 5
}

