"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.proxyConfiguration = void 0;
const apify_1 = require("apify");
const general_1 = require("./general");
/**
 * Do a generic check when using Apify Proxy
 *
 * @example
 *    const proxy = await proxyConfiguration({
 *       proxyConfig: input.proxy,
 *       blacklist: ['SHADER'],
 *       hint: ['RESIDENTIAL']
 *    });
 *
 * @param {ProxyConfigurationOptions} params
 * @returns {Promise<ProxyConfiguration | undefined>}
 */
const proxyConfiguration = async ({ proxyConfig, required = true, force = apify_1.Actor.isAtHome(), blacklist = ['GOOGLESERP'], hint = [] }) => {
    const log = (0, general_1.labeledLog)({ label: 'ProxyConfiguration' });
    const configuration = await apify_1.Actor.createProxyConfiguration(proxyConfig);
    // @ts-ignore
    const { groups, newUrl, proxyUrls, usesApifyProxy } = configuration || {};
    // this works for custom proxyUrls
    if (apify_1.Actor.isAtHome() && required) {
        if (!configuration || (!usesApifyProxy && (!proxyUrls || !proxyUrls.length)) || typeof newUrl !== 'function') {
            throw new Error('\n=======\nYou must use Apify proxy or custom proxy URLs\n\n=======');
        }
    }
    // check when running on the platform by default
    if (force) {
        // only when actually using Apify proxy it needs to be checked for the groups
        if (configuration && usesApifyProxy) {
            if (blacklist.some((blacklisted) => (groups || []).includes(blacklisted))) {
                throw new Error(
                // eslint-disable-next-line max-len
                `\n=======\nThese proxy groups cannot be used in this actor. Choose other group or contact support@apify.com to give you proxy trial:\n\n*  ${blacklist.join('\n*  ')}\n\n=======`);
            }
            // specific non-automatic proxy groups like RESIDENTIAL, not an error, just a hint
            if (hint.length && !hint.some((group) => (groups || []).includes(group))) {
                log.info(`\n=======\nYou can pick specific proxy groups for better experience:\n\n*  ${hint.join('\n*  ')}\n\n=======`);
            }
        }
    }
    return configuration;
};
exports.proxyConfiguration = proxyConfiguration;
//# sourceMappingURL=proxy.js.map