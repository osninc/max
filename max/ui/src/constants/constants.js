export const BUILD = "yir-dev";
export const STARTDETAILSACTOR = false;

export const ACTORS = {
    ZILLOW: {
        COUNT: {
            BUILD: BUILD,
            ID: "OVT9EXRpZMjSZ2lhS"
        },
        DETAILS: {
            BUILD: BUILD,
            ID: "cFgGRlqgcB99RCBE5",
            GRAPHQL: "https://www.zillow.com/graphql"
        }
    },
    REDFIN: {
        COUNT: {
            BUILD: BUILD,
            ID: "Q6imaQAKtun38uOho"
        },
        DETAILS: {
            BUILD: BUILD,
            ID: "",
            GRAPHQL: ""
        }
    },
    REALTOR: {
        COUNT: {
            BUILD: BUILD,
            ID: "eluFxHcr2G7Z3pzO8"
        },
        DETAILS: {
            BUILD: BUILD,
            ID: "",
            GRAPHQL: ""
        }
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
        RUNS: "/acts/<ACTORID>/runs/?"
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
        color: "#1277e1"
    },
    redfin: {
        color: "#a02021"
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

