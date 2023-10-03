import statesJson from "../test_data/states.json" assert { type: "json" }

export const getState = state => {
    return statesJson[state];
}