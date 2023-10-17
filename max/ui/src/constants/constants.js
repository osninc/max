export const BUILD = "yir-dev-2"

export const USETEST = {
    counts: true,
    listings: true,
    details: true
}

export const APIFY = {
    base: {
        url: "https://api.apify.com/v2/acts/OVT9EXRpZMjSZ2lhS",
        token: "apify_api_eVR6ZxQGjhIbayqnfEDxPwGa8p4EF61kQe2H"
    },
    counts: {
        use: "realTime",
        method: "post",
        endPoint: "/run-sync-get-dataset-items",
        old: "https://api.apify.com/v2/datasets/RYjTNctyQeqlnFAAI/items?token=apify_api_eVR6ZxQGjhIbayqnfEDxPwGa8p4EF61kQe2H",
        realTime: `https://api.apify.com/v2/acts/OVT9EXRpZMjSZ2lhS/run-sync-get-dataset-items?token=apify_api_eVR6ZxQGjhIbayqnfEDxPwGa8p4EF61kQe2H&build=<BUILD>`
    },
    listings: {
        use: "realTime",
        method: "post",
        old: `https://api.apify.com/v2/acts/land-stats~maxlistings/run-sync-get-dataset-items?token=apify_api_eVR6ZxQGjhIbayqnfEDxPwGa8p4EF61kQe2H`,
        realTime: `https://api.apify.com/v2/acts/9mmQQrjPzESssOG3d/run-sync-get-dataset-items?token=apify_api_eVR6ZxQGjhIbayqnfEDxPwGa8p4EF61kQe2H`
    },
    details: {
        use: "realTime",
        method: "post",
        old: "",
        endPoint: "/run-sync-get-dataset-items",
        realTime: "https://www.zillow.com/graphql",
        backup: "https://api.apify.com/v2/acts/Iv8c0Q2qJueBe2sg6/run-sync-get-dataset-items?token=apify_api_eVR6ZxQGjhIbayqnfEDxPwGa8p4EF61kQe2H"
    },
    builds: {
        endPoint: "/builds",
        realTime: "https://api.apify.com/v2/acts/land-stats~maxeverythingcount/builds?token=apify_api_eVR6ZxQGjhIbayqnfEDxPwGa8p4EF61kQe2H",
        method: "get"
    },
    runs: {
        endPoint: "/runs",
        realTime: "https://api.apify.com/v2/acts/OVT9EXRpZMjSZ2lhS/runs?token=apify_api_eVR6ZxQGjhIbayqnfEDxPwGa8p4EF61kQe2H",
        method: "get"
    },
    datasets: {
        endPoint: "/items",
        realTime: "https://api.apify.com/v2/datasets/<DATASETID>/items",
        method: "get"
    },
    inputs: {
        realTime: "https://api.apify.com/v2/key-value-stores/<STOREID>/records/INPUT",
        method: "get"
    }
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
    }
}

