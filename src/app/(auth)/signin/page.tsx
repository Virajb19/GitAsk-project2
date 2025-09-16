import { redirect } from "next/navigation";
import SignIn from "~/components/auth/SignIn";
import { auth } from "~/server/auth";

export default async function SignInPage() {

    const session = await auth()

    if(session?.user) {
        redirect('/')
    }

    return <SignIn />
}