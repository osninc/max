import { ProxyConfiguration, ProxyConfigurationOptions as ApifyProxyConfigurationOptions } from 'apify';
/**
 * ProxyConfigurationOptions
 */
export type ProxyConfigurationOptions = {
    /**
     *  Provided apify proxy configuration
     */
    proxyConfig?: ApifyProxyConfigurationOptions & {
        useApifyProxy?: boolean;
    };
    /**
     *  Make the proxy usage required when running on the platform
     */
    required?: boolean;
    /**
     *  Blacklist of proxy groups, by default it's ['GOOGLE_SERP']
     */
    blacklist?: string[];
    /**
     *  By default, it only do the checks on the platform. Force checking regardless where it's running
     */
    force?: boolean;
    /**
     *  Hint specific proxy groups that should be used, like SHADER or RESIDENTIAL
     */
    hint?: string[];
};
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
export declare const proxyConfiguration: ({ proxyConfig, required, force, blacklist, hint }: ProxyConfigurationOptions) => Promise<ProxyConfiguration | undefined>;
