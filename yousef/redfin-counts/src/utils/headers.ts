export const RANDOM_HEADERS = {
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
}

export const DEFAULT_HEADERS = {
    Accept: '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'upgrade-insecure-requests': '1',
    'x-requested-with': 'XMLHttpRequest',
    'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
    'accept-language': 'en-US,en-CA;q=0.9,en-AU;q=0.8,en;q=0.7',
    'sec-ch-ua': '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site'
}
