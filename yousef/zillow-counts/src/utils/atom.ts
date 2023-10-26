import crypto from 'crypto'

import _ from 'lodash'

export const getRandomInt = (max: number) => {
    return Math.floor(Math.random() * max)
}

export const sqft2acre = (num: any) => {
    if (num === '') return ''
    return parseFloat((num / 43560).toFixed(2))
}

export const alphaNum = (str: string) => {
    return str.replace(/[^0-9a-z ]/gi, '')
}

export const alphaNumWithoutSpace = (str: string) => {
    return str.replace(/[^0-9a-z]/gi, '')
}

export const camelizeStr = (str: string) => {
    return alphaNumWithoutSpace(str)
}

export const convertArea4Zillow = (params: any, searchType: string) => {
    let str = params.usersSearchTerm
    if (searchType.toLowerCase() === 'zipcode') {
        // Just in case city is more than one word
        str = `${params.cityState}-${params.usersSearchTerm}`
        return str
    }

    const newStr = alphaNum(str)
    return newStr.replace(/ /gi, '-').toLowerCase()
}

export const lotSizeToString = (min: any, max: any) => {
    let keyName = `${min}-${max}`

    if (max === '') keyName = `${min}+`
    if (min === '') keyName = `0-${max}`
    if (min === '' && max === '') keyName = 'TOTAL'

    return keyName
}

export const randomXToY = (minVal: number, maxVal: number) => {
    const randVal = minVal + Math.random() * (maxVal - minVal)
    return Math.round(randVal)
}

export const getValidKVSRecordKey = (str: string, hashKey = false) => {
    if (!hashKey) {
        return str.replace(/[^[a-zA-Z0-9!\-_.'()]/g, '')
        // return str.replace(/([+/=])/g, '')
    }
    return crypto
        .createHash('sha256')
        .update(str)
        .digest('base64')
        .replace(/([+/=])/g, '')
        .substr(0, 255)
}

export const transformHeaders = (object: any) => {
    return _.transform<any, any>(object, (r, val, key) => {
        r[_.lowerCase(key as string).replace(/ /g, () => '-')] = val
    })
}
