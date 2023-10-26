import { Actor, ProxyConfiguration, ProxyConfigurationOptions as ApifyProxyConfigurationOptions } from 'apify'

import { labeledLog } from './general'

/**
 * ProxyConfigurationOptions
 */
export type ProxyConfigurationOptions = {
    /**
     *  Provided apify proxy configuration
     */
    proxyConfig?: ApifyProxyConfigurationOptions & {
        useApifyProxy?: boolean
    }
    /**
     *  Make the proxy usage required when running on the platform
     */
    required?: boolean
    /**
     *  Blacklist of proxy groups, by default it's ['GOOGLE_SERP']
     */
    blacklist?: string[]
    /**
     *  By default, it only do the checks on the platform. Force checking regardless where it's running
     */
    force?: boolean
    /**
     *  Hint specific proxy groups that should be used, like SHADER or RESIDENTIAL
     */
    hint?: string[]
}

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
export const proxyConfiguration = async ({
    proxyConfig,
    required = true,
    force = Actor.isAtHome(),
    blacklist = ['GOOGLESERP'],
    hint = []
}: ProxyConfigurationOptions): Promise<ProxyConfiguration | undefined> => {
    const log = labeledLog({ label: 'ProxyConfiguration' })

    const configuration = await Actor.createProxyConfiguration(proxyConfig)

    // @ts-ignore
    const { groups, newUrl, proxyUrls, usesApifyProxy } = configuration || {}
    // this works for custom proxyUrls
    if (Actor.isAtHome() && required) {
        if (!configuration || (!usesApifyProxy && (!proxyUrls || !proxyUrls.length)) || typeof newUrl !== 'function') {
            throw new Error('\n=======\nYou must use Apify proxy or custom proxy URLs\n\n=======')
        }
    }

    // check when running on the platform by default
    if (force) {
        // only when actually using Apify proxy it needs to be checked for the groups
        if (configuration && usesApifyProxy) {
            if (blacklist.some((blacklisted) => (groups || []).includes(blacklisted))) {
                throw new Error(
                    // eslint-disable-next-line max-len
                    `\n=======\nThese proxy groups cannot be used in this actor. Choose other group or contact support@apify.com to give you proxy trial:\n\n*  ${blacklist.join(
                        '\n*  '
                    )}\n\n=======`
                )
            }

            // specific non-automatic proxy groups like RESIDENTIAL, not an error, just a hint
            if (hint.length && !hint.some((group) => (groups || []).includes(group))) {
                log.info(
                    `\n=======\nYou can pick specific proxy groups for better experience:\n\n*  ${hint.join(
                        '\n*  '
                    )}\n\n=======`
                )
            }
        }
    }

    return configuration
}
