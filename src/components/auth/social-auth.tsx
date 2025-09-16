'use client'

import { motion } from 'framer-motion'
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { FaGithub} from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useLoadingState } from '~/lib/store';
import { twMerge } from 'tailwind-merge';

export const DemarcationLine = () => (
    <div className="flex items-center my-4 w-full">
      <div className="flex-grow h-px bg-gray-300" />
      <span className="px-4 text-sm text-gray-500 whitespace-nowrap font-semibold">or continue with</span>
      <div className="flex-grow h-px bg-gray-300" />
    </div>
  )

export function OAuthButton({label, provider}: {label: string, provider: string}) {

    // const [loading,setLoading] = useState(false)
    const { loading, setLoading } = useLoadingState()
    const queryClient = useQueryClient()
    
  return (
    <motion.button
      onClick={async () => {
        try {
          setLoading(true)
          await signIn(provider, { callbackUrl: "/" });
          // toast.success("Signed in successfully");

          // const projectId = localStorage.getItem('projectId')
          // queryClient.prefetchQuery({ 
          //   queryKey: ['getCommits', projectId],
          //   queryFn: async () => {
          //      const { data : { commits }} = await axios.get(`/api/commits/${projectId}`)
          //      return commits
          //   }
          // })
          
        } catch (error) {
          console.error(error)
          toast.error("Something went wrong !!!");
          setLoading(false)
        }
      }}
      disabled={loading}
      className={twMerge("flex-center gap-4 w-full sm:w-fit mx-auto rounded-xl px-4 py-2 mb-2 text-base border-[3px] dark:border-transparent duration-300 disabled:cursor-not-allowed disabled:opacity-60",
         provider === 'github' ? 'dark:bg-white/20 font-semibold' : 'bg-white text-black font-semibold'
      )}
    >
       {label}
       {provider === 'github' ? <FaGithub className='size-8'/> : <FcGoogle className='size-8'/>}

    </motion.button>
  )
}
  