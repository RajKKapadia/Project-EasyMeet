"use server"

import { clerkClient } from "@clerk/nextjs/server"
import { google } from "googleapis"
import { addMinutes, endOfDay, startOfDay } from "date-fns"

export async function getCalendarEventTimes(
    { clerkUserId, start, end }: { clerkUserId: string, start: Date, end: Date }
) {
    const oAuthClient = await getOAuthClient(clerkUserId)

    const events = await google.calendar("v3").events.list({
        calendarId: "primary",
        eventTypes: ["default"],
        singleEvents: true,
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        maxResults: 2500,
        auth: oAuthClient,
    })

    return (
        events.data.items
            ?.map(event => {
                if (event.start?.date != null && event.end?.date != null) {
                    return {
                        start: startOfDay(event.start.date),
                        end: endOfDay(event.end.date),
                    }
                }

                if (event.start?.dateTime != null && event.end?.dateTime != null) {
                    return {
                        start: new Date(event.start.dateTime),
                        end: new Date(event.end.dateTime),
                    }
                }
            })
            .filter(date => date != null) || []
    )
}

export async function createCalendarEvent({
    clerkUserId,
    guestName,
    guestEmail,
    startTime,
    guestNotes,
    durationInMinutes,
    eventName,
}: {
    clerkUserId: string
    guestName: string
    guestEmail: string
    startTime: Date
    guestNotes?: string | null
    durationInMinutes: number
    eventName: string
}) {
    const oAuthClient = await getOAuthClient(clerkUserId)
    const calendarUser = await (await clerkClient()).users.getUser(clerkUserId)
    if (calendarUser.primaryEmailAddress == null) {
        throw new Error("Clerk user has no email")
    }

    const calendarEvent = await google.calendar("v3").events.insert({
        calendarId: "primary",
        auth: oAuthClient,
        sendUpdates: "all",
        conferenceDataVersion: 1,
        requestBody: {
            attendees: [
                { email: guestEmail, displayName: guestName },
                {
                    email: calendarUser.primaryEmailAddress.emailAddress,
                    displayName: calendarUser.fullName,
                    responseStatus: "accepted",
                },
            ],
            description: guestNotes ? `Additional Details: ${guestNotes}` : "No description.",
            start: {
                dateTime: startTime.toISOString(),
            },
            end: {
                dateTime: addMinutes(startTime, durationInMinutes).toISOString(),
            },
            summary: `${guestName} + ${calendarUser.fullName}: ${eventName}`,
            conferenceData: {
                createRequest: {
                    requestId: crypto.randomUUID(),
                    conferenceSolutionKey: {
                        type: "hangoutsMeet"
                    }
                }
            }
        }
    })

    return calendarEvent.data
}

async function getOAuthClient(clerkUserId: string) {
    const token = await (await clerkClient()).users.getUserOauthAccessToken(
        clerkUserId,
        "oauth_google"
    )

    if (token.data.length === 0 || token.data[0].token == null) {
        return
    }

    // Validate environment variables
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
    const redirectUrl = process.env.GOOGLE_OAUTH_REDIRECT_URL

    if (!clientId || !clientSecret || !redirectUrl) {
        console.error('Missing Google OAuth environment variables')
        return
    }

    const client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUrl
    )

    client.setCredentials({ access_token: token.data[0].token })

    return client
}