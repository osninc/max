export const matrix = {
    zillow: {
        status: {
            "sold": "isRecentlySold",
            "for sale": "sale"
        },
        time: {
            "7 days": "7",
            "30 days": "30",
            "90 days": "90",
            "6 months": "6m",
            "12 months": "12m",
            "24 months": "24m",
            "36 months": "36m"
        },
        lot: {
            "0-1": {
                minLotSize: "",
                maxLotSize: 43560
            },
            "1-2": {
                minLotSize: 43560,
                maxLotSize: 87120
            },
            "2-5": {
                minLotSize: 87120,
                maxLotSize: 217800
            },
            "5-10": {
                minLotSize: 217800,
                maxLotSize: 435600
            },
            "10-20": {
                minLotSize: 435600,
                maxLotSize: 871200
            },
            "20-50": {
                minLotSize: 871200,
                maxLotSize: 2178000
            },
            "50-100": {
                minLotSize: 2178000,
                maxLotSize: 4356000
            },
            "100+": {
                minLotSize: 4356000,
                maxLotSize: ""
            },
            "total": {
                minLotSize: "",
                maxLotSize: ""
            }
        }
    },
    redfin: {
        status: {
            "sold": "isRecentlySold",
            "for sale": "sale"
        },
        time: {
            "1 day": "7",
            "3 days": "",
            "1 week": "90",
            "14 days": "",
            "1 month": "30",
            "45 days": "",
            "3 months": "24m",
            "6 months": "",
            "1 year": "6m",
            "2 years": "12m",
            "3 years": "36m",
            "5 years": ""
        },
        lot: {
            "0-0": {
                minLotSize: 0,
                maxLotSize: 0
            },
            "0-0.05": {
                minLotSize: 0,
                maxLotSize: 2000
            },
            "0.05-0.1": {
                minLotSize: 2000,
                maxLotSize: 4500
            },
            "0.1-0.15": {
                minLotSize: 4500,
                maxLotSize: 6500
            },
            "0.15-0.18": {
                minLotSize: 6500,
                maxLotSize: 8000
            },
            "0.18-0.22": {
                minLotSize: 8000,
                maxLotSize: 9500
            },
            "0.22-0.25": {
                minLotSize: 9500,
                maxLotSize: 10890
            },
            "0.25-0.5": {
                minLotSize: 10890,
                maxLotSize: 21780
            },
            "0.5-1": {
                minLotSize: 21780,
                maxLotSize: 43560
            },
            "1-2": {
                minLotSize: 43560,
                maxLotSize: 87120
            },
            "2-3": {
                minLotSize: 87120,
                maxLotSize: 130680
            },
            "3-4": {
                minLotSize: 130680,
                maxLotSize: 174240
            },
            "4-5": {
                minLotSize: 174240,
                maxLotSize: 217800
            },
            "5-10": {
                minLotSize: 217800,
                maxLotSize: 435600
            },
            "10-20": {
                minLotSize: 435600,
                maxLotSize: 871200
            },
            "20-40": {
                minLotSize: 871200,
                maxLotSize: 1742400
            },
            "40-100": {
                minLotSize: 1742400,
                maxLotSize: 4356000
            },
            "100-0": {
                minLotSize: 4356000,
                maxLotSize: ""
            }
        }
    }
}

// export const statusMatrix = {
//         "sold": "isRecentlySold",
//         "for sale": "sale"
//     }

export const timeMatrix = {
        "7 days": "7",
        "30 days": "30",
        "90 days": "90",
        "6 months": "6m",
        "12 months": "12m",
        "24 months": "24m",
        "36 months": "36m"
    }
// export const lotMatrix = {
//         "0-1": {
//             minLotSize: "",
//             maxLotSize: 43560
//         },
//         "1-2": {
//             minLotSize: 43560,
//             maxLotSize: 87120
//         },
//         "2-5": {
//             minLotSize: 87120,
//             maxLotSize: 217800
//         },
//         "5-10": {
//             minLotSize: 217800,
//             maxLotSize: 435600
//         },
//         "10-20": {
//             minLotSize: 435600,
//             maxLotSize: 871200
//         },
//         "20-50": {
//             minLotSize: 871200,
//             maxLotSize: 2178000
//         },
//         "50-100": {
//             minLotSize: 2178000,
//             maxLotSize: 4356000
//         },
//         "100+": {
//             minLotSize: 4356000,
//             maxLotSize: ""
//         },
//         "total": {
//             minLotSize: "",
//             maxLotSize: ""
//         },
//     }
