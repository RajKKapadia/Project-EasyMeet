"use client"

import { useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { DAYS_OF_WEEK_IN_ORDER } from "@/data/constants"
import { scheduleFormSchema } from "@/schema/schedule"
import { timeToInt } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatTimezoneOffset } from "@/lib/formatters"
import { Fragment, useState, useEffect } from "react"
import { Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { saveSchedule } from "@/server/actions/schedule"

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

type Availability = {
    startTime: string
    endTime: string
    dayOfWeek: (typeof DAYS_OF_WEEK_IN_ORDER)[number]
}


export default function ScheduleForm({ schedule }: {
    schedule?: {
        timezone: string,
        availabilities: Availability[]
    }
}) {
    const [successMessage, setSuccessMessage] = useState<string>()
    const [availableTimezones, setAvailableTimezones] = useState<string[]>([])
    const [isTimezonesLoading, setIsTimezonesLoading] = useState(true)

    const form = useForm<z.infer<typeof scheduleFormSchema>>({
        resolver: zodResolver(scheduleFormSchema),
        defaultValues: {
            timezone: schedule?.timezone ?? getSafeTimezone(),
            availabilities: schedule?.availabilities.toSorted((a, b) => {
                return timeToInt(a.startTime) - timeToInt(b.startTime)
            })
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

    const { append: addAvailability, remove: removeAvailability, fields: availabilityFields } = useFieldArray({ name: "availabilities", control: form.control })

    const groupedAvailabilityFields = Object.groupBy(
        availabilityFields.map((field, index) => ({ ...field, index })),
        availability => availability.dayOfWeek
    )

    async function onSubmit(values: z.infer<typeof scheduleFormSchema>) {
        const data = await saveSchedule(values)
        if (data?.error) {
            form.setError("root", { message: "There was an error saving your data." })
        } else {
            setSuccessMessage("Schedule saved!")
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
                {successMessage && (
                    <div className="text-green-600 text-sm font-semibold">
                        {successMessage}
                    </div>
                )}
                <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Timezone</FormLabel>
                            <FormControl>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                The name user will see when booking an event.
                            </FormDescription>
                            <FormMessage></FormMessage>
                        </FormItem>
                    )}
                ></FormField>

                <div className="grid grid-cols-[auto,1fr] gap-y-6 gap-x-6">
                    {DAYS_OF_WEEK_IN_ORDER.map((dow, index) => {
                        return (
                            <Fragment>
                                <div className="capitalize text-sm font-semibold flex justify-center items-center">{dow}</div>
                                <div className="flex flex-col gap-2">
                                    <Button variant={"outline"} type="button" className="p-1 size-8" onClick={() => {
                                        addAvailability({
                                            dayOfWeek: dow,
                                            startTime: "9:00",
                                            endTime: "17:00"
                                        })
                                    }}>
                                        <Plus className="size-full"></Plus>
                                    </Button>
                                    {groupedAvailabilityFields[dow]?.map((field, lableIndex) => {
                                        return (
                                            <div className="flex flex-col gap-1" key={field.id}>
                                                <div className="flex gap-2 items-center">
                                                    <FormField
                                                        control={form.control}
                                                        name={`availabilities.${field.index}.startTime`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input
                                                                        className="w-24"
                                                                        {...field}
                                                                        aria-label={`${dow} Start Time ${lableIndex + 1}`}
                                                                    ></Input>
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    ></FormField>

                                                    to

                                                    <FormField
                                                        control={form.control}
                                                        name={`availabilities.${field.index}.endTime`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input
                                                                        className="w-24"
                                                                        {...field}
                                                                        aria-label={`${dow} End Time ${lableIndex + 1}`}
                                                                    ></Input>
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    ></FormField>

                                                    <Button type="button" className="size-8 p-1" variant={"destructiveGhost"} onClick={() => removeAvailability(field.index)}>
                                                        <X className="size-full"></X>
                                                    </Button>

                                                </div>
                                                <FormMessage>
                                                    {form.formState.errors.availabilities?.at?.(field.index)?.root?.message}
                                                </FormMessage>
                                                <FormMessage>
                                                    {form.formState.errors.availabilities?.at?.(field.index)?.startTime?.message}
                                                </FormMessage>
                                                <FormMessage>
                                                    {form.formState.errors.availabilities?.at?.(field.index)?.endTime?.message}
                                                </FormMessage>
                                            </div>
                                        )
                                    })}
                                </div>
                            </Fragment>
                        )
                    })}
                </div>

                <div className="flex gap-2 justify-end">
                    <Button disabled={form.formState.isSubmitting} type="submit">
                        Save
                    </Button>
                </div>
            </form>
        </Form >
    )
}