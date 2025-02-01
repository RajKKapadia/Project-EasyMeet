"use server"

import { db } from "@/drizzle/db"
import { getValidTimesFromSchedule } from "@/lib/getValidTimesFromSchedule"
import { meetingActionSchema } from "@/schema/meetings"
import "use-server"
import { z } from "zod"
import { createCalendarEvent } from "../googleCalendar"
import { redirect } from "next/navigation"
import { fromZonedTime } from "date-fns-tz"

export async function createMeeting(
    unsafeData: z.infer<typeof meetingActionSchema>
) {
    const { success, data } = meetingActionSchema.safeParse(unsafeData)

    console.log(`Flag for parsing: ${success}`)
    console.log(`Parsed data: ${JSON.stringify(data, null, 2)}`)

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

    console.log(`Event: ${JSON.stringify(event, null, 2)}`)

    if (event == null) return { error: true }
    const startInTimezone = fromZonedTime(data.startTime, data.timezone)

    console.log(`Start time zone: ${startInTimezone}`)

    const validTimes = await getValidTimesFromSchedule({ timesInOrder: [startInTimezone], event: event })
    console.log(`Valid times: ${validTimes}`)
    if (validTimes.length === 0) return { error: true }

    await createCalendarEvent({
        ...data,
        startTime: startInTimezone,
        durationInMinutes: event.durationInMinutes,
        eventName: event.name,
    })

    console.log("Event created...")

    redirect(
        `/book/${data.clerkUserId}/${data.eventId
        }/success?startTime=${data.startTime.toISOString()}`
    )
}
