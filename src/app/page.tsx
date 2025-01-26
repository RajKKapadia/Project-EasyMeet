import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth()
  if (userId != null) {
    redirect("/events")
  }
  return (
    <div className="text-center container my-4 mx-auto h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl mb-4">Fancy Home Page Coming Soon!</h1>
      <div className="flex justify-center gap-2">
        <Button asChild><SignInButton></SignInButton></Button>
        <Button asChild><SignUpButton></SignUpButton></Button>
        <UserButton></UserButton>
      </div>
    </div>
  )
}
