"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockRequests = void 0;
const DEFAULT_RESOURCE_EXCLUSIONS = ['image', 'media', 'stylesheet', 'font', 'other'];
const blockRequests = async (page, options) => {
    const blockedResources = options?.resources ?? DEFAULT_RESOURCE_EXCLUSIONS;
    await page.route('**/*', (route) => {
        return blockedResources.includes(route.request().resourceType()) ? route.abort() : route.continue();
    });
};
exports.blockRequests = blockRequests;
//# sourceMappingURL=playwright.js.map