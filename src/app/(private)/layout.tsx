import { NavLink } from "@/components/NavLink";
import { UserButton } from "@clerk/nextjs";
import { CalendarRange } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

export default function PrivateLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <header className="flex py-2 border-b bg-card">
                <nav className="container flex gap-6 items-center font-medium text-sm">
                    <div className="flex mr-auto gap-2 font-semibold items-center">
                        <Link href={"/events"} className="flex mr-auto gap-2 font-semibold items-center">
                            <CalendarRange className="size-6"></CalendarRange>
                            <span className="sr-only md:not-sr-only">EasyMeet</span>
                        </Link>
                    </div>
                    <NavLink href="/events">Events</NavLink>
                    <NavLink href="/schedules">Schedules</NavLink>
                    <div className="ml-auto size-10">
                        <UserButton appearance={{ elements: { userButtonAvatarBox: "size-full" } }}></UserButton>
                    </div>
                </nav>
            </header>
            <main className="container my-6">{children}</main>
        </>
    )
}