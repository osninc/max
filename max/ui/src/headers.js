export const randomHeaders = {
    devices: ['mobile', 'desktop'],
    locales: ['en-US'],
    operatingSystems: ['windows', 'macos', 'android', 'ios', 'linux'],
    browsers: [{
        name: 'chrome',
        minVersion: 87,
        maxVersion: 89
    }, 'edge', 'firefox', 'safari'],
}

export const defaultHeaders = {
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9',
    'upgrade-insecure-requests': '1',
    "x-requested-with": "XMLHttpRequest",
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
    "accept-language": "en-US,en-CA;q=0.9,en-AU;q=0.8,en;q=0.7",
    "sec-ch-ua":
        '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    // "Access-Control-Allow-Origin:": "https://lustrous-sunburst-ef0f75.netlify.app",
    // "Access-Control-Allow-Methods": "POST, GET, PUT",
    // "Access-Control-Allow-Headers": "Content-Type"
}

export const graphqlHeaders =  {
    'authority': 'www.zillow.com',
    'method': 'POST',
    //'path': '/graphql/?zpid={}'.format(zpid),
    'scheme': 'https',
    'accept': '*/*',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'en-US,en',
    'content-type': 'text/plain',
    'dnt': '1',
    'origin': 'https://www.zillow.com',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36'
}