// import { getValidTimesFromSchedule } from "@/lib/getValidTimesFromSchedule";

// getValidTimesFromSchedule([new Date(Date.parse("Sun Feb 02 2025 23:15:00 GMT+0000"))],
//     {
//         durationInMinutes: 15,
//         clerkUserId: "user_2rWmQLgVF13473zu2Mir3l0Yefx"
//     })
//     .then((res) => {
//         console.log(res)
//     })
//     .catch((err) => {
//         console.log(err)
//     })

import { formatTimezoneOffset } from "@/lib/formatters"

const data = formatTimezoneOffset("Asia/Kolkata")
console.log(data)