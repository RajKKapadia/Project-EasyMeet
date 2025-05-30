"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { fromZonedTime } from "date-fns-tz"
import { isValid } from "date-fns"

import { db } from "@/drizzle/db"
import { getValidTimesFromSchedule } from "@/lib/getValidTimesFromSchedule"
import { meetingActionSchema } from "@/schema/meetings"

export async function createMeeting(
    unsafeData: z.infer<typeof meetingActionSchema>
) {
    const { success, data } = meetingActionSchema.safeParse(unsafeData)

    if (!success) {
        console.error('Validation failed:', meetingActionSchema.safeParse(unsafeData).error)
        return { error: true, message: "Invalid form data" }
    }

    const event = await db.query.EventTable.findFirst({
        where(fields, operators) {
            return operators.and(
                operators.eq(fields.isActive, true),
                operators.eq(fields.clerkUserId, data.clerkUserId),
                operators.eq(fields.id, data.eventId)
            )
        },
    })

    if (event == null) {
        console.error('Event not found:', data.eventId)
        return { error: true, message: "Event not found" }
    }

    // Convert string to Date and validate
    const startTime = new Date(data.startTime)
    if (!isValid(startTime)) {
        console.error('Invalid startTime provided:', data.startTime)
        return { error: true, message: "Invalid start time" }
    }

    let startInTimezone: Date
    try {
        startInTimezone = fromZonedTime(startTime, data.timezone)
        if (!isValid(startInTimezone)) {
            console.error('Invalid date created after timezone conversion:', startInTimezone)
            return { error: true, message: "Timezone conversion failed" }
        }
    } catch (error) {
        console.error('Error converting timezone:', error, 'startTime:', data.startTime, 'timezone:', data.timezone)
        return { error: true }
    }

    const validTimes = await getValidTimesFromSchedule({ timesInOrder: [startInTimezone], event: event })

    if (validTimes.length === 0) {
        console.error('No valid times available for:', startInTimezone)
        return { error: true, message: "Selected time is no longer available" }
    }

    // await createCalendarEvent({
    //     ...data,
    //     startTime: startInTimezone,
    //     durationInMinutes: event.durationInMinutes,
    //     eventName: event.name,
    // })

    // Safely handle the redirect with validated date
    const startTimeParam = isValid(startInTimezone)
        ? startInTimezone.toISOString()
        : new Date().toISOString()

    redirect(
        `/book/${data.clerkUserId}/${data.eventId
        }/success?startTime=${startTimeParam}`
    )
}
