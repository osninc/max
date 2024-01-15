import { alphaNum } from '../atom'

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
