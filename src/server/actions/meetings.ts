"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
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
    // The client already sends a properly converted UTC time, so no additional conversion needed
    const startInTimezone = new Date(data.startTime)
    if (!isValid(startInTimezone)) {
        console.error('Invalid startTime provided:', data.startTime)
        return { error: true, message: "Invalid start time" }
    }

    const validTimes = await getValidTimesFromSchedule({ timesInOrder: [startTime], event: event })

    if (validTimes.length === 0) {
        console.error('No valid times available for:', startTime)
        return { error: true, message: "Selected time is no longer available" }
    }

    // await createCalendarEvent({
    //     ...data,
    //     startTime: startInTimezone,
    //     durationInMinutes: event.durationInMinutes,
    //     eventName: event.name,
    // })

    // Safely handle the redirect with validated date
    const startTimeParam = isValid(startTime)
        ? startTime.toISOString()
        : new Date().toISOString()

    redirect(
        `/book/${data.clerkUserId}/${data.eventId
        }/success?startTime=${startTimeParam}`
    )
}
