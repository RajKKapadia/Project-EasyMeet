import { Button } from "@/components/ui/button";
import { db } from "@/drizzle/db";
import { auth } from "@clerk/nextjs/server";
import { CalendarPlus, CalendarRange } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEventDescription } from "@/lib/formatters";
import { CopyEventButton } from "@/components/CopyEventButton";
import { cn } from "@/lib/utils";

export const revalidate = 0

export default async function EventsPage() {
    const { userId, redirectToSignIn } = await auth()
    if (userId === null) {
        redirectToSignIn()
    }
    const events = await db.query.EventTable.findMany({
        where(fields, operators) {
            return operators.eq(fields.clerkUserId, userId as string)
        },
        orderBy(fields, operators) {
            return operators.desc(fields.createdAt)
        }
    })
    return (
        <>
            <div className="flex gap-4 items-center mb-6">
                <h1 className="text-3xl lg:text-4x; xl:text-5xl font-semibold">Events</h1>
                <Button asChild>
                    <Link href="/events/new">
                        <CalendarPlus className="mr-4 size-6"></CalendarPlus>
                        New Event
                    </Link>
                </Button>
            </div>
            {
                events.length > 0 ? (
                    <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(400px,1fr))]">
                        {events.map((event, index) => {
                            return (
                                <EventCard key={event.id} {...event}></EventCard>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 font-semibold">
                        <CalendarRange className="mx-auto size-16"></CalendarRange>
                        You do not have any events yet, Create your first event to get started.
                        <Button size={"lg"} asChild className="text-lg">
                            <Link href="/events/new">
                                <CalendarPlus className="mr-4 size-6"></CalendarPlus>
                                New event
                            </Link>
                        </Button>
                    </div>
                )
            }
        </>
    )
}

type EventCardProps = {
    id: string
    isActive: boolean
    name: string
    description: string | null
    durationInMinutes: number
    clerkUserId: string
}

function EventCard({
    id,
    isActive,
    name,
    description,
    durationInMinutes,
    clerkUserId
}: EventCardProps) {
    return (
        <Card className={cn("flex flex-col", !isActive && "border-secondary/50")}>
            <CardHeader className={cn(!isActive && "opacity-50")}>
                <CardTitle>{name}</CardTitle>
                <CardDescription>
                    {formatEventDescription(durationInMinutes)}
                </CardDescription>
            </CardHeader>
            {description !== null && (
                <CardContent className={cn(!isActive && "opacity-50")}>{description}</CardContent>
            )}
            <CardFooter className="mt-auto gap-2 flex justify-end">
                {isActive && <CopyEventButton clerkUserId={clerkUserId} eventId={id} variant={"outline"}></CopyEventButton>}
                <Button asChild>
                    <Link href={`/events/${id}/edit`}>Edit</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}