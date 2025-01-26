"use server"

import { db } from "@/drizzle/db"
import { EventTable } from "@/drizzle/schema"
import { eventFormSchema } from "@/schema/events"
import { auth } from "@clerk/nextjs/server"
import { and, eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import "use-server"
import { z } from "zod"

export async function createEvent(unSafeData: z.infer<typeof eventFormSchema>): Promise<{ error: boolean } | null> {
    const { userId } = await auth()
    const { success, data } = eventFormSchema.safeParse(unSafeData)
    if (!success || userId === null) {
        return { error: true }
    } else {
        await db.insert(EventTable).values({ ...data, clerkUserId: userId })
        redirect("/events")
    }
}

export async function updateEvent(id: string, unSafeData: z.infer<typeof eventFormSchema>): Promise<{ error: boolean } | null> {
    const { userId } = await auth()
    const { success, data } = eventFormSchema.safeParse(unSafeData)
    if (!success || userId === null) {
        return { error: true }
    } else {
        const { rowCount } = await db.update(EventTable).set({ ...data }).where(and(eq(EventTable.id, id), eq(EventTable.clerkUserId, userId)))
        if (rowCount === 0) {
            return { error: true }
        }
        redirect("/events")
    }
}

export async function deleteEvent(id: string): Promise<{ error: boolean } | null> {
    const { userId } = await auth()
    if (userId === null) {
        return { error: true }
    } else {
        const { rowCount } = await db.delete(EventTable).where(and(eq(EventTable.id, id), eq(EventTable.clerkUserId, userId)))
        if (rowCount === 0) {
            return { error: true }
        }
        redirect("/events")
    }
}
