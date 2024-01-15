"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOT_SIZE_FOR_URL = exports.FOR_SALE_TIME_FOR_URL = exports.LOT_SIZE = exports.SOLD_TIME_MATRIX = exports.FOR_SALE_TIME_MATRIX = exports.STATUS_MATRIX = exports.REALTOR = void 0;
exports.REALTOR = {
    URL: {
        LOCATION: 'https://parser-external.geo.moveaws.com/suggest?input=QUERY&client_id=rdc-home&limit=10&area_types=address%2Cneighborhood%2Ccity%2Ccounty%2Cpostal_code%2Cstreet%2Cschool%2Cschool_district%2Cuniversity%2Cpark%2Cstate%2Cmlsid&lat=-1&long=-1'
    },
    PLACE_TYPE: {
        county: 'county',
        zipcode: 'postal_code',
        city: 'city',
        state: 'state'
    },
    EXAMPLE_HEADERS: {
        PROPERTY: {
            authority: 'www.realtor.com',
            // eslint-disable-next-line max-len
            accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'accept-language': 'en-US,en;q=0.9',
            'cache-control': 'max-age=0',
            // 'if-none-match': '"4cdd4-YWns8VIgLY2eAJx16x+9mciRddA"',
            'sec-ch-ua': '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Linux"',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'none',
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': 1,
            'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
        }
    }
};
exports.STATUS_MATRIX = ['For Sale', 'Sold'];
exports.FOR_SALE_TIME_MATRIX = [
    ['1-', 'Today'],
    ['7', '7 days'],
    ['14', '14 days'],
    ['21', '21 days'],
    ['30', '30 days']
];
exports.SOLD_TIME_MATRIX = [['', '']];
exports.LOT_SIZE = [
    ['', '2000'],
    ['2000', '3000'],
    ['3000', '4000'],
    ['4000', '5000'],
    ['5000', '7500'],
    ['7500', '10890'],
    ['10890', '21780'],
    ['21780', '43560'],
    ['43560', '87120'],
    ['87120', '217800'],
    ['217800', '435600'],
    ['435600', '653400'],
    ['653400', '871200'],
    ['871200', '2178000'],
    ['2178000', '4356000'],
    ['4356000', ''],
    ['', '']
];
exports.FOR_SALE_TIME_FOR_URL = {
    '7': '7',
    '14': '14',
    '21': '21',
    '30': '30'
};
// export const SOLD_TIME_FOR_URL = {}
exports.LOT_SIZE_FOR_URL = {
    '2000': '2000',
    '3000': '3000',
    '4000': '4000',
    '5000': '5000',
    '7500': '7500',
    '10890': '10890',
    '21780': '21780',
    '43560': '43560',
    '87120': '87120',
    '217800': '217800',
    '435600': '435600',
    '653400': '653400',
    '871200': '871200',
    '2178000': '2178000',
    '4356000': '4356000'
};
//# sourceMappingURL=consts.js.map