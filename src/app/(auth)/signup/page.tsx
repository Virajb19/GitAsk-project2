import { redirect } from "next/navigation";
import SignUp from "~/components/auth/SignUp";
import { auth } from "~/server/auth";

export default async function SignInPage() {
  
    const session = await auth()
    if(session?.user) {
        redirect('/')
    }
    return <SignUp />
}