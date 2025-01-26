import ScheduleForm from "@/components/forms/ScheduleForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/drizzle/db"
import { auth } from "@clerk/nextjs/server"

export const revalidate = 0

export default async function SchedulesPage() {
    const { userId, redirectToSignIn } = await auth()
    if (userId === null) {
        return redirectToSignIn()
    }

    const schedule = await db.query.ScheduleTable.findFirst({
        where(fields, operators) {
            return operators.eq(fields.clerkUserId, userId)
        },
        with: { availabilities: true }
    })

    return (
        <Card>
            <CardHeader>
                <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent>
                <ScheduleForm schedule={schedule}></ScheduleForm>
            </CardContent>
        </Card>
    )
}
