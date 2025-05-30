"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { fromZonedTime } from "date-fns-tz"

import { createCalendarEvent } from "../googleCalendar"
import { db } from "@/drizzle/db"
import { getValidTimesFromSchedule } from "@/lib/getValidTimesFromSchedule"
import { meetingActionSchema } from "@/schema/meetings"

export async function createMeeting(
    unsafeData: z.infer<typeof meetingActionSchema>
) {
    console.log("In the create meeting function.")
    const { success, data } = meetingActionSchema.safeParse(unsafeData)

    console.log(success)
    console.log(data)

    if (!success) return { error: true }

    const event = await db.query.EventTable.findFirst({
        where(fields, operators) {
            return operators.and(
                operators.eq(fields.isActive, true),
                operators.eq(fields.clerkUserId, data.clerkUserId),
                operators.eq(fields.id, data.eventId)
            )
        },
    })
    console.log(event)

    if (event == null) return { error: true }

    const startInTimezone = fromZonedTime(data.startTime, data.timezone)
    const validTimes = await getValidTimesFromSchedule({ timesInOrder: [startInTimezone], event: event })

    console.log(validTimes)

    if (validTimes.length === 0) return { error: true }

    await createCalendarEvent({
        ...data,
        startTime: startInTimezone,
        durationInMinutes: event.durationInMinutes,
        eventName: event.name,
    })

    redirect(
        `/book/${data.clerkUserId}/${data.eventId
        }/success?startTime=${data.startTime.toISOString()}`
    )
}
