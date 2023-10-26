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
    accept: '*/*',
    'upgrade-insecure-requests': '1',
    'x-requested-with': 'XMLHttpRequest',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site'
}
