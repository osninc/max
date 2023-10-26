export const randomXToY = (minVal: number, maxVal: number) => {
    const randVal = minVal + Math.random() * (maxVal - minVal)
    return Math.round(randVal)
}
