'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import {ArrowRight, Sparkles} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Skeleton } from '~/components/ui/skeleton'
import Link from 'next/link'
import FloatingShapes from '~/components/Floating-shapes'

export default function HomePage() {

   const {data: session, status} = useSession()
   const isAuth = !!session

  return <main className="relative w-full min-h-screen flex-center bg-opacity-60 overflow-hidden">

    <FloatingShapes />

    <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{duration: 0.7,type: 'spring', damping: '10', bounce: 0.24}} 
    className='w-[90%] sm:w-1/3 max-w-3xl z-30'>

        <Card className='shadow-lg shadow-blue-500'>
           <CardHeader>
                <CardTitle>
                  <h1 className='text-5xl text-center mb:text-4xl text-wrap mb:flex mb:flex-col'>Welcome to 
                    <span className="mb:text-4xl ml-3 mb:ml-0 bg-gradient-to-r from-blue-400 to-blue-700 bg-clip-text font-black tracking-tighter text-transparent">
                      {/* {"GitAsk".split('').map((char,i) => {
                        return <motion.span className='inline-block' key={i} initial={{y: 20, opacity: 0, scale: 0.7, filter: 'blur(5px)'}} animate={{y: 0, opacity: 1, scale: 1, filter: 'blur(0px)'}} transition={{duration: 0.5, ease: 'easeInOut', delay: i * 0.1}}>{char}</motion.span>
                      })} */}
                      GitAsk
                      </span>
                      </h1>
                </CardTitle>
                 <CardDescription className='text-center'>
                     <h3 className='flex-center gap-2 text-2xl mb:text-sm'><Sparkles className='size-7 text-yellow-600 fill-yellow-600'/>Ask AI anything about your repo</h3>
                 </CardDescription>
                  <CardContent>
                      {status === 'loading' ? <Skeleton className='w-full h-10'/> : (
                         <Link href={isAuth ? '/dashboard' : '/signup'} className='flex-center gap-3 text-xl mb:text-base text-white font-semibold mt-5 hover:opacity-75 duration-200 group mx-auto px-4 py-2 rounded-lg bg-blue-700'>{isAuth ? 'Go to Dashboard' : 'Sign up to get started'}<ArrowRight strokeWidth={3} className='group-hover:translate-x-3 duration-200'/></Link>
                      )}
                  </CardContent>
           </CardHeader>

        </Card>
        </motion.div>
  </main>
}