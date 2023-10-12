export const statusMatrix = {
    "sold": "isRecentlySold",
    "for sale": "sale"
}

export const timeMatrix = {
    "7 days": "7",
    "30 days": "30",
    "90 days": "90",
    "6 months": "6m",
    "12 months": "12m",
    "24 months": "24m",
    "36 months": "36m"
}
export const lotMatrix = {
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
    },
}
