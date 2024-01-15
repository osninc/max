import statesJson from './data/states.json'

export const getState = (state: string) => {
    return statesJson.find((st) => st.abbr === state)
}
