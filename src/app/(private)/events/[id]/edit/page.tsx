import EventForm from "@/components/forms/EventForm"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { db } from "@/drizzle/db"
import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"

export const revalidate = 0

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
    const { userId, redirectToSignIn } = await auth()

    if (userId === null) {
        redirectToSignIn()
    }

    const id = (await params).id
    const event = await db.query.EventTable.findFirst({
        where(fields, operators) {
            return operators.and(
                operators.eq(fields.clerkUserId, userId as string),
                operators.eq(fields.id, id)
            )
        },
    })
    if (event === null) {
        return (
            notFound()
        )
    }
    return (
        <Card className="mx-auto max-w-md">
            <CardHeader>Edit Event</CardHeader>
            <CardContent>
                <EventForm event={{ ...event!, description: event?.description || undefined }}></EventForm>
            </CardContent>
        </Card>
    )
}
