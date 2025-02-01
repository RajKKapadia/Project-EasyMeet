import { getValidTimesFromSchedule } from "@/lib/getValidTimesFromSchedule";

getValidTimesFromSchedule({
    timesInOrder: [new Date(Date.parse("Sun Feb 02 2025 23:15:00 GMT+0000"))],
    event: {
        durationInMinutes: 15,
        clerkUserId: "user_2rWmQLgVF13473zu2Mir3l0Yefx"
    }
})
    .then((res) => {
        console.log(res)
    })
    .catch((err) => {
        console.log(err)
    })