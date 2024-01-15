export const LABELS = {
    PROPERTY: 'PROPERTY'
}

export const PAGE_OPENED_LOG_MESSAGE_PROPS_TO_PICK = ['zpid']

export const DESTINATION = {
    PROPERTY: 'PROPERTY'
}

// TODO: This value becomes inactive when actor hasn't has been used in a while
// To manually get this value, I had to go to a page like https://www.zillow.com/homes/2123957397_zpid/
// while inspecting the network tab and filter 'graphql', there will be a request to ZILLOW_URL_PROPERTY 
// but with a different sha256hash
const ZILLOW_SHA256 = 
      '039596cb39c417a2ccfd80ee32aee8612afde917ee4f3a41bec70c687a2e1027'

export const ZILLOW_URL_PROPERTY =
     `https://www.zillow.com/graphql/?extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22${ZILLOW_SHA256}%22%7D%7D&variables=%7B%22zpid%22%3AZPID%2C%22platform%22%3A%22DESKTOP_WEB%22%2C%22formType%22%3A%22OPAQUE%22%2C%22contactFormRenderParameter%22%3A%7B%22zpid%22%3AZPID%2C%22platform%22%3A%22desktop%22%2C%22isDoubleScroll%22%3Atrue%7D%2C%22skipCFRD%22%3Afalse%7D`

export const OUTPUT_FIELDS = {
    AGENT_NAME: 'agentName'
}

export const DEFAULT_OUTPUT = {
    attributionInfo: null,
    priceHistory: null
    // url: ''
}
