import statesJson from './data/states.json'

export const getState = (state: string) => {
    return (statesJson as any)[state]
}
