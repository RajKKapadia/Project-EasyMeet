"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { eventFormSchema } from "@/schema/events"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createEvent, deleteEvent, updateEvent } from "@/server/actions/events"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useTransition } from "react"


export default function EventForm({ event }: {
    event?: {
        id: string
        name: string
        description?: string
        durationInMinutes: number
        isActive: boolean
    }
}) {
    const [isPending, startTransition] = useTransition()
    const form = useForm<z.infer<typeof eventFormSchema>>({
        resolver: zodResolver(eventFormSchema),
        defaultValues: event ?? {
            name: "",
            isActive: true,
            durationInMinutes: 30
        }
    })
    async function onSubmit(values: z.infer<typeof eventFormSchema>) {
        const action = event === undefined ? createEvent : updateEvent.bind(null, event?.id as string)
        const data = await action(values)
        if (data?.error) {
            form.setError("root", { message: "There was an error saving your data." })
        }
    }
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
                {form.formState.errors.root && (
                    <div className="text-destructive text-sm">
                        {form.formState.errors.root.message}
                    </div>
                )}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Event Name</FormLabel>
                            <FormControl>
                                <Input {...field}></Input>
                            </FormControl>
                            <FormDescription>
                                The name user will see when booking an event.
                            </FormDescription>
                            <FormMessage></FormMessage>
                        </FormItem>
                    )}
                ></FormField>

                <FormField
                    control={form.control}
                    name="durationInMinutes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Duration</FormLabel>
                            <FormControl>
                                <Input type="number" {...field}></Input>
                            </FormControl>
                            <FormDescription>
                                In minutes
                            </FormDescription>
                            <FormMessage></FormMessage>
                        </FormItem>
                    )}
                ></FormField>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Event description</FormLabel>
                            <FormControl>
                                <Textarea {...field} className="resize-none h-32"></Textarea>
                            </FormControl>
                            <FormDescription>
                                Optional description about the event.
                            </FormDescription>
                            <FormMessage></FormMessage>
                        </FormItem>
                    )}
                ></FormField>

                <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex gap-2 items-center">
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    ></Switch>
                                </FormControl>
                                <FormLabel>Active</FormLabel>
                            </div>
                            <FormDescription>
                                Inactive events will not be visible for users to book an event.
                            </FormDescription>
                            <FormMessage></FormMessage>
                        </FormItem>
                    )}
                ></FormField>

                <div className="flex gap-2 justify-end">
                    {event && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant={"destructiveGhost"} disabled={form.formState.isSubmitting || isPending}>Delete</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your
                                        event and remove your event data from our servers.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction variant={"destructiveGhost"} disabled={form.formState.isSubmitting || isPending} onClick={() => {
                                        startTransition(async () => {
                                            const data = await deleteEvent(event.id)
                                            if (data?.error) {
                                                form.setError("root", { message: "There was an error saving your data." })
                                            }
                                        })
                                    }}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <Button type="button" asChild variant={"outline"}>
                        <Link href="/events">Cancel</Link>
                    </Button>
                    <Button type="submit">
                        {event === undefined ? "Save" : "Update"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}