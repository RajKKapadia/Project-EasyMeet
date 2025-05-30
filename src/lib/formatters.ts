export function formatEventDescription(durationInMinutes: number): string {
    const hours = Math.floor(durationInMinutes / 60)
    const minutes = durationInMinutes % 60
    const minutesString = `${minutes} ${minutes > 1 ? "mins" : "min"}`
    const hoursString = `${hours} ${hours > 1 ? "hrs" : "hr"}`

    if (hours === 0) return minutesString
    if (minutes === 0) return hoursString
    return `${hoursString} ${minutesString}`
}

export function formatTimezoneOffset(timezone: string) {
    try {
        if (!timezone || typeof timezone !== 'string') {
            console.warn('Invalid timezone provided to formatTimezoneOffset:', timezone)
            return 'UTC+0'
        }
        
        // Try the primary method
        const result = new Intl.DateTimeFormat(undefined, {
            timeZone: timezone,
            timeZoneName: "shortOffset",
        })
            .formatToParts(new Date())
            .find(part => part.type === "timeZoneName")?.value
            
        if (result) {
            return result
        }
        
        // Fallback: try with different timeZoneName format
        const fallbackResult = new Intl.DateTimeFormat(undefined, {
            timeZone: timezone,
            timeZoneName: "short",
        })
            .formatToParts(new Date())
            .find(part => part.type === "timeZoneName")?.value
            
        if (fallbackResult) {
            return fallbackResult
        }
        
        // Ultimate fallback: calculate offset manually
        const now = new Date()
        const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }))
        const localDate = new Date(now.toLocaleString("en-US", { timeZone: timezone }))
        const offsetMs = localDate.getTime() - utcDate.getTime()
        const offsetHours = Math.floor(offsetMs / (1000 * 60 * 60))
        const offsetMinutes = Math.floor((offsetMs % (1000 * 60 * 60)) / (1000 * 60))
        
        const sign = offsetHours >= 0 ? '+' : '-'
        const absHours = Math.abs(offsetHours)
        const absMinutes = Math.abs(offsetMinutes)
        
        return `UTC${sign}${absHours.toString().padStart(2, '0')}:${absMinutes.toString().padStart(2, '0')}`
    } catch (error) {
        console.error('Error formatting timezone offset for timezone:', timezone, error)
        return 'UTC+0'
    }
}

// Safe formatters with fallbacks for serverless environments
let dateFormatter: Intl.DateTimeFormat
try {
    dateFormatter = new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
    })
} catch (error) {
    console.warn('Failed to create dateFormatter with dateStyle, using fallback:', error)
    dateFormatter = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

export function formatDate(date: Date) {
    try {
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
            console.warn('Invalid date provided to formatDate:', date)
            return 'Invalid Date'
        }
        return dateFormatter.format(date)
    } catch (error) {
        console.error('Error formatting date:', date, error)
        return 'Invalid Date'
    }
}

let timeFormatter: Intl.DateTimeFormat
try {
    timeFormatter = new Intl.DateTimeFormat(undefined, {
        timeStyle: "short",
    })
} catch (error) {
    console.warn('Failed to create timeFormatter with timeStyle, using fallback:', error)
    timeFormatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    })
}

export function formatTimeString(date: Date) {
    try {
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
            console.warn('Invalid date provided to formatTimeString:', date)
            return 'Invalid Time'
        }
        return timeFormatter.format(date)
    } catch (error) {
        console.error('Error formatting time string:', date, error)
        return 'Invalid Time'
    }
}

let dateTimeFormatter: Intl.DateTimeFormat
try {
    dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    })
} catch (error) {
    console.warn('Failed to create dateTimeFormatter with dateStyle/timeStyle, using fallback:', error)
    dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    })
}

export function formatDateTime(date: Date) {
    try {
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
            console.warn('Invalid date provided to formatDateTime:', date)
            return 'Invalid Date/Time'
        }
        return dateTimeFormatter.format(date)
    } catch (error) {
        console.error('Error formatting date time:', date, error)
        return 'Invalid Date/Time'
    }
}