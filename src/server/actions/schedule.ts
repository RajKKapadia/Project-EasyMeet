"use server"

import { auth } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { BatchItem } from "drizzle-orm/batch"
import { z } from "zod"

import { db } from "@/drizzle/db"
import { ScheduleAvailabilityTable, ScheduleTable } from "@/drizzle/schema"
import { scheduleFormSchema } from "@/schema/schedule"

export async function saveSchedule(
    unsafeData: z.infer<typeof scheduleFormSchema>
) {
    const { userId } = await auth()
    const { success, data } = scheduleFormSchema.safeParse(unsafeData)

    if (!success || userId == null) {
        return { error: true }
    }

    const { availabilities, ...scheduleData } = data

    const [{ id: scheduleId }] = await db
        .insert(ScheduleTable)
        .values({ ...scheduleData, clerkUserId: userId })
        .onConflictDoUpdate({
            target: ScheduleTable.clerkUserId,
            set: scheduleData,
        })
        .returning({ id: ScheduleTable.id })

    const statements: [BatchItem<"pg">] = [
        db
            .delete(ScheduleAvailabilityTable)
            .where(eq(ScheduleAvailabilityTable.scheduleId, scheduleId)),
    ]

    if (availabilities.length > 0) {
        statements.push(
            db.insert(ScheduleAvailabilityTable).values(
                availabilities.map(availability => ({
                    ...availability,
                    scheduleId,
                }))
            )
        )
    }

    await db.batch(statements)
}
