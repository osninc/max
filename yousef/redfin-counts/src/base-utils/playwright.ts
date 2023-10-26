import { Page } from 'playwright-core'

const DEFAULT_RESOURCE_EXCLUSIONS = ['image', 'media', 'stylesheet', 'font', 'other']

export interface IBlockRequestsOptions {
    // eslint-disable-next-line max-len
    // Contains the request's resource type as it was perceived by the rendering engine. ResourceType will be one of the following: document, stylesheet, image, media, font, script, texttrack, xhr, fetch, eventsource, websocket, manifest, other.
    resources?: string[]
}

export const blockRequests = async (page: Page, options?: IBlockRequestsOptions): Promise<void> => {
    const blockedResources = options?.resources ?? DEFAULT_RESOURCE_EXCLUSIONS
    await page.route('**/*', (route) => {
        return blockedResources.includes(route.request().resourceType()) ? route.abort() : route.continue()
    })
}
