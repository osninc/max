import statesJson from "../test_data/states.json" assert { type: "json" }
import statesJson2 from './data/states.json' assert { type: "json" }

export const getState = state => {
    return statesJson[state];
}

export const getStateFips = (state) => {
    return statesJson2.find((st) => st.abbr === state)
}
