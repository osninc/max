"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEARCH_HEADERS = exports.HOMES_PAGE_HEADERS = exports.RANDOM_HEADERS = void 0;
exports.RANDOM_HEADERS = {
    devices: ['mobile', 'desktop'],
    locales: ['en-US'],
    operatingSystems: ['windows', 'macos', 'android', 'ios', 'linux'],
    browsers: [
        {
            name: 'chrome',
            minVersion: 87,
            maxVersion: 89
        },
        'edge',
        'firefox',
        'safari'
    ]
};
exports.HOMES_PAGE_HEADERS = {
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
};
exports.SEARCH_HEADERS = {
    authority: 'www.zillow.com',
    accept: '*/*',
    'accept-language': 'en-US,en;q=0.9',
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
    'sec-ch-ua': '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin'
};
//# sourceMappingURL=headers.js.map