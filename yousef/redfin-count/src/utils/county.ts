import countiesJson from './data/counties.json'

export const getCounty = (county: string) => {
    const [name, stateAbbr] = county.replace(' County', '').split(', ')
    return countiesJson.find((c) => c.name === name && c.state === stateAbbr)
}
