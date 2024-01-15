import { getValidKey, RequestObjectArray } from '../base-utils'

import { IFinalInput, IInput } from './types'
import { LABELS } from './consts'

export const validateInput = (input: IInput) => {
    const { extraBlockFunc: extraBlockFuncStr } = input
    const extraBlockFunc = extraBlockFuncStr ? eval(extraBlockFuncStr) : undefined
    void extraBlockFunc
}

export const prepareStartSessionRequests = (input: IFinalInput) => {
    const { websiteUrl, maxSessions = 10, medium, proxyType } = input
    const requests: RequestObjectArray = []
    for (let i = 0; i < maxSessions; i++) {
        const id = `${i}`
        requests.push({
            url: websiteUrl,
            uniqueKey: getValidKey(`${LABELS.SESSION}_${id}`),
            userData: {
                label: LABELS.SESSION,
                id,
                websiteUrl,
                medium,
                proxyType
            },
            skipNavigation: true
        })
    }
    return requests
}
