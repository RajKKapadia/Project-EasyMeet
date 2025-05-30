import { DAYS_OF_WEEK_IN_ORDER } from "@/data/constants"
import { db } from "@/drizzle/db"
import { ScheduleAvailabilityTable } from "@/drizzle/schema"
import { getCalendarEventTimes } from "@/server/googleCalendar"
import {
    addMinutes,
    areIntervalsOverlapping,
    isFriday,
    isMonday,
    isSaturday,
    isSunday,
    isThursday,
    isTuesday,
    isWednesday,
    isWithinInterval,
    setHours,
    setMinutes,
    isValid,
} from "date-fns"
import { fromZonedTime } from "date-fns-tz"

export async function getValidTimesFromSchedule(
    { timesInOrder, event }: {
        timesInOrder: Date[],
        event: { clerkUserId: string; durationInMinutes: number }
    }
) {
    const start = timesInOrder[0]
    const end = timesInOrder.at(-1)

    if (start == null || end == null) return []

    const schedule = await db.query.ScheduleTable.findFirst({
        where: ({ clerkUserId: userIdCol }, { eq }) =>
            eq(userIdCol, event.clerkUserId),
        with: { availabilities: true },
    })

    if (schedule == null) return []

    const groupedAvailabilities = Object.groupBy(
        schedule.availabilities,
        a => a.dayOfWeek
    )

    const eventTimes = await getCalendarEventTimes({
        clerkUserId: event.clerkUserId,
        end: end,
        start: start
    })

    return timesInOrder.filter(intervalDate => {
        try {
            // Validate the interval date
            if (!isValid(intervalDate)) {
                console.warn('Invalid intervalDate in filter:', intervalDate)
                return false
            }
            
            const availabilities = getAvailabilities(
                groupedAvailabilities,
                intervalDate,
                schedule.timezone
            )
            
            const endTime = addMinutes(intervalDate, event.durationInMinutes)
            if (!isValid(endTime)) {
                console.warn('Invalid end time calculated:', endTime, 'from:', intervalDate, 'duration:', event.durationInMinutes)
                return false
            }
            
            const eventInterval = {
                start: intervalDate,
                end: endTime,
            }

            return (
                eventTimes.every(eventTime => {
                    try {
                        return !areIntervalsOverlapping(eventTime, eventInterval)
                    } catch (error) {
                        console.warn('Error checking interval overlap:', error, 'eventTime:', eventTime, 'eventInterval:', eventInterval)
                        return false
                    }
                }) &&
                availabilities.some(availability => {
                    try {
                        return (
                            isWithinInterval(eventInterval.start, availability) &&
                            isWithinInterval(eventInterval.end, availability)
                        )
                    } catch (error) {
                        console.warn('Error checking availability interval:', error, 'availability:', availability, 'eventInterval:', eventInterval)
                        return false
                    }
                })
            )
        } catch (error) {
            console.error('Error processing intervalDate in filter:', error, 'intervalDate:', intervalDate)
            return false
        }
    })
}

function getAvailabilities(
    groupedAvailabilities: Partial<
        Record<
            (typeof DAYS_OF_WEEK_IN_ORDER)[number],
            (typeof ScheduleAvailabilityTable.$inferSelect)[]
        >
    >,
    date: Date,
    timezone: string
) {
    let availabilities:
        | (typeof ScheduleAvailabilityTable.$inferSelect)[]
        | undefined

    if (isMonday(date)) {
        availabilities = groupedAvailabilities.monday
    }
    if (isTuesday(date)) {
        availabilities = groupedAvailabilities.tuesday
    }
    if (isWednesday(date)) {
        availabilities = groupedAvailabilities.wednesday
    }
    if (isThursday(date)) {
        availabilities = groupedAvailabilities.thursday
    }
    if (isFriday(date)) {
        availabilities = groupedAvailabilities.friday
    }
    if (isSaturday(date)) {
        availabilities = groupedAvailabilities.saturday
    }
    if (isSunday(date)) {
        availabilities = groupedAvailabilities.sunday
    }

    if (availabilities == null) return []

    return availabilities.map(({ startTime, endTime }) => {
        try {
            // Validate time format and parse safely
            const startParts = startTime.split(":")
            const endParts = endTime.split(":")
            
            if (startParts.length !== 2 || endParts.length !== 2) {
                console.warn('Invalid time format:', { startTime, endTime })
                return null
            }
            
            const startHour = parseInt(startParts[0], 10)
            const startMinute = parseInt(startParts[1], 10)
            const endHour = parseInt(endParts[0], 10)
            const endMinute = parseInt(endParts[1], 10)
            
            // Validate parsed time values
            if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute) ||
                startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23 ||
                startMinute < 0 || startMinute > 59 || endMinute < 0 || endMinute > 59) {
                console.warn('Invalid time values:', { startHour, startMinute, endHour, endMinute })
                return null
            }
            
            const start = fromZonedTime(
                setMinutes(
                    setHours(date, startHour),
                    startMinute
                ),
                timezone
            )

            const end = fromZonedTime(
                setMinutes(
                    setHours(date, endHour),
                    endMinute
                ),
                timezone
            )
            
            // Validate the created dates
            if (!isValid(start) || !isValid(end)) {
                console.warn('Invalid dates created from availability:', { start, end, startTime, endTime, date, timezone })
                return null
            }

            return { start, end }
        } catch (error) {
            console.error('Error parsing availability times:', error, { startTime, endTime, date, timezone })
            return null
        }
    }).filter((availability): availability is { start: Date; end: Date } => availability !== null)
}
