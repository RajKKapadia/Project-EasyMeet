"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { meetingFormSchema } from "@/schema/meetings"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { useMemo, useTransition, useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate, formatTimeString, formatTimezoneOffset } from "@/lib/formatters"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "../ui/calendar"
import { isSameDay, isValid } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { createMeeting } from "@/server/actions/meetings"

// Safe timezone detection with fallbacks for serverless environments
function getSafeTimezone(): string {
    try {
        // Try browser timezone detection first
        if (typeof window !== 'undefined') {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        }
        // Server-side fallback
        return 'UTC'
    } catch (error) {
        console.warn('Failed to detect timezone, falling back to UTC:', error)
        return 'UTC'
    }
}

// Safe timezone list with fallbacks
function getSafeTimezones(): string[] {
    try {
        if (typeof Intl.supportedValuesOf === 'function') {
            return Intl.supportedValuesOf("timeZone")
        }
    } catch (error) {
        console.warn('Intl.supportedValuesOf not available, using fallback timezone list:', error)
    }

    // Fallback timezone list for common timezones
    return [
        'UTC',
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'Europe/London',
        'Europe/Paris',
        'Europe/Berlin',
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Asia/Kolkata',
        'Australia/Sydney',
        'Pacific/Auckland'
    ]
}

// Convert UTC date to timezone-aware date using date-fns-tz
function convertToTimezone(date: Date, timezone: string) {
    try {
        // Validate input date
        if (!isValid(date)) {
            console.warn('Invalid date passed to convertToTimezone:', date)
            return date
        }

        // Use toZonedTime to properly convert UTC to target timezone
        const convertedDate = toZonedTime(date, timezone)

        // Additional validation of the converted date
        if (!isValid(convertedDate)) {
            console.warn('toZonedTime returned invalid date:', convertedDate)
            return date
        }

        return convertedDate
    } catch (error) {
        console.error('Error converting date to timezone:', error, 'date:', date, 'timezone:', timezone)
        return date
    }
}

export default function MeetingForm({ validTimes, eventId, clerkUserId }: {
    validTimes: Date[],
    eventId: string,
    clerkUserId: string
}) {
    const [isPending, startTransition] = useTransition()
    const [availableTimezones, setAvailableTimezones] = useState<string[]>([])
    const [isTimezonesLoading, setIsTimezonesLoading] = useState(true)

    const form = useForm<z.infer<typeof meetingFormSchema>>({
        resolver: zodResolver(meetingFormSchema),
        defaultValues: {
            timezone: getSafeTimezone(),
            date: undefined,
            startTime: undefined,
            guestName: "",
            guestEmail: "",
            guestNotes: ""
        }
    })

    // Load timezones safely on client side
    useEffect(() => {
        const loadTimezones = async () => {
            try {
                const timezones = getSafeTimezones()
                setAvailableTimezones(timezones)
            } catch (error) {
                console.warn('Failed to load timezones, using minimal fallback:', error)
                setAvailableTimezones(['UTC'])
            } finally {
                setIsTimezonesLoading(false)
            }
        }

        loadTimezones()
    }, [])
    const timezone = form.watch("timezone")
    const date = form.watch("date")
    const validTimesInTimezone = useMemo(() => {
        if (!timezone) return []
        return validTimes.map(date => {
            try {
                // Validate input date
                if (!isValid(date)) {
                    console.warn('Invalid date passed to validTimesInTimezone:', date)
                    return null
                }

                // Use proper timezone conversion that maintains the relationship to original UTC time
                const convertedDate = convertToTimezone(date, timezone)

                // Additional validation of the converted date
                if (!isValid(convertedDate)) {
                    console.warn('convertToTimezone returned invalid date:', convertedDate)
                    // Fallback: return original date if timezone conversion fails
                    return date
                }

                return convertedDate
            } catch (error) {
                console.error('Error converting date to timezone:', error, 'date:', date, 'timezone:', timezone)
                // Fallback: return original date if any error occurs
                return date
            }
        }).filter((date): date is Date => date !== null && isValid(date))
    }, [validTimes, timezone])
    function onSubmit(values: z.infer<typeof meetingFormSchema>) {
        console.log("In the meeting form...")
        console.log(values)
        startTransition(async () => {
            try {
                const data = await createMeeting({
                    ...values,
                    startTime: values.startTime?.toISOString() || '',
                    eventId: eventId,
                    clerkUserId: clerkUserId
                })
                if (data?.error) {
                    form.setError("root", {
                        message: data.message || "There was an error creating your meeting",
                    })
                }
            } catch (error) {
                console.error('Meeting creation failed:', error)
                form.setError("root", {
                    message: "Failed to create meeting. Please try again.",
                })
            }
        })
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
                    name="timezone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Timezone</FormLabel>
                            <FormControl>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue></SelectValue>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {isTimezonesLoading ? (
                                            <SelectItem value="loading" disabled>Loading timezones...</SelectItem>
                                        ) : (
                                            availableTimezones.map((timezone) => {
                                                return (
                                                    <SelectItem key={timezone} value={timezone}>
                                                        {timezone}
                                                        {` (${formatTimezoneOffset(timezone)})`}
                                                    </SelectItem>
                                                )
                                            })
                                        )}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormDescription>
                                Select your timezone for the meeting.
                            </FormDescription>
                            <FormMessage></FormMessage>
                        </FormItem>
                    )}
                ></FormField>

                <div className="flex gap-4 flex-col md:flex-row">

                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <Popover>
                                <FormItem className="flex-1">
                                    <FormLabel>Date</FormLabel>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "pl-3 text-left font-normal flex w-full",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    formatDate(field.value)
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={date =>
                                                !validTimesInTimezone.some(time =>
                                                    isSameDay(date, time)
                                                )
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                    <FormMessage />
                                </FormItem>
                            </Popover>
                        )}
                    ></FormField>

                    <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Time</FormLabel>
                                <Select
                                    disabled={date == null || timezone == null}
                                    onValueChange={value => {
                                        try {
                                            const newDate = new Date(value)
                                            if (!isValid(newDate)) {
                                                console.warn('Invalid date created from value:', value)
                                                return
                                            }
                                            field.onChange(newDate)
                                        } catch (error) {
                                            console.error('Error creating date from value:', value, error)
                                        }
                                    }}
                                    value={field.value && isValid(field.value) ? field.value.toISOString() : ""}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue
                                                placeholder={
                                                    date == null || timezone == null
                                                        ? "Select a date/timezone first"
                                                        : "Select a meeting time"
                                                }
                                            />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {date && validTimesInTimezone
                                            .filter(time => {
                                                try {
                                                    return isValid(time) && isSameDay(time, date)
                                                } catch (error) {
                                                    console.warn('Error filtering time:', time, error)
                                                    return false
                                                }
                                            })
                                            .map(time => {
                                                try {
                                                    if (!isValid(time)) {
                                                        console.warn('Invalid time in map:', time)
                                                        return null
                                                    }
                                                    const isoString = time.toISOString()
                                                    return (
                                                        <SelectItem
                                                            key={isoString}
                                                            value={isoString}
                                                        >
                                                            {formatTimeString(time)}
                                                        </SelectItem>
                                                    )
                                                } catch (error) {
                                                    console.error('Error creating SelectItem for time:', time, error)
                                                    return null
                                                }
                                            })
                                            .filter(Boolean)}
                                    </SelectContent>
                                </Select>

                                <FormMessage />
                            </FormItem>
                        )}
                    ></FormField>

                </div>

                <div className="flex gap-4 flex-col md:flex-row">
                    <FormField
                        control={form.control}
                        name="guestName"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Your Name</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="guestEmail"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Your Email</FormLabel>
                                <FormControl>
                                    <Input type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="guestNotes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                                <Textarea className="resize-none" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex gap-2 justify-end">
                    <Button
                        disabled={form.formState.isSubmitting}
                        type="button"
                        asChild
                        variant="outline"
                    >
                        <Link href={`/book/${clerkUserId}`}>Cancel</Link>
                    </Button>
                    <Button disabled={form.formState.isSubmitting || isPending} type="submit">
                        Schedule
                    </Button>
                </div>

            </form>
        </Form>
    )
}