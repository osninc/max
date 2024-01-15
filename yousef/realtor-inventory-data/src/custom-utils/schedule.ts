import { Actor } from 'apify'
import moment = require('moment')

import { GlobalContext } from '../base-utils'

import { IFinalInput, IGlobalContextShared, IGlobalContextState } from './types'

export const updateSchedule = async (
    globalContext: GlobalContext<IFinalInput, IGlobalContextState, IGlobalContextShared>
) => {
    const { scheduleId, apifyToken } = globalContext.input
    const { nextUpdateDate = moment().add(1, 'month').format('YYYY-MM-DD') } = globalContext.state
    const nextUpdateDateObj = moment(nextUpdateDate).add(3, 'days').toDate()
    const nextUpdateDateDay = nextUpdateDateObj.getDate()
    const nextUpdateDateMonth = nextUpdateDateObj.getMonth() + 1

    const apifyClient = apifyToken ? Actor.newClient({ token: apifyToken }) : Actor.apifyClient

    const schedule = await apifyClient
        .schedule(scheduleId)
        .update({ cronExpression: `0 7 ${nextUpdateDateDay} ${nextUpdateDateMonth} *` })
    void schedule
}
