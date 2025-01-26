import EventForm from "@/components/forms/EventForm"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function NewEventPage() {
    return (
        <Card className="mx-auto max-w-md">
            <CardHeader>New Event</CardHeader>
            <CardContent>
                <EventForm></EventForm>
            </CardContent>
        </Card>
    )
}
