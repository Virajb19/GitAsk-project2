'use client'

import { useState } from "react"
import { Slider } from "./ui/slider"
import { createCheckoutSession } from "~/server/actions"
import { toast } from "sonner"

export default function BuyCredits() {

    const [creditsToBuy, setCreditsToBuy] = useState<number>(100)
    const price = (creditsToBuy / 50).toFixed(2)

  return <div className="flex flex-col gap-5 mt-4 items-start">
        <Slider className="" defaultValue={[100]} value={[creditsToBuy]} min={10} max={1000} step={10} onValueChange={value => setCreditsToBuy(value[0] ?? 100)}/>
        <button onClick={async () => {
            // const id = toast.loading('Directing to Stripe page...')
            // try {
            //     await createCheckoutSession(creditsToBuy)
            // } catch(err) {
            //      toast.error('Something went wrong!')
            // } finally {
            //     toast.dismiss(id)
            // }
            toast.promise(createCheckoutSession(creditsToBuy), { loading: 'Directing to Stripe page...', success: 'Directed', error: 'Something went wrong!!'})
        }} className="bg-blue-600 font-semibold text-lg px-4 py-2 rounded-md hover:opacity-80 duration-100">Buy {creditsToBuy} for ${price}</button>
  </div>
}