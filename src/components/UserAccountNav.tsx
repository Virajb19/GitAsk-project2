'use client'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "~/components/ui/dropdown-menu"
import { LogOut, Home } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import UserAvatar from './UserAvatar';
import Link from "next/link";

export default function UserAccountNav() {

    const {data: session} = useSession()
    const user = session?.user

    return <main className="mb:text-xs">
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger>
                        <UserAvatar />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className='m-2 min-w-44 z-[99999] rounded-md bg-neutral-100 dark:bg-neutral-900 border-[3px] border-blue-500' align='center'> 
                     <DropdownMenuItem>
                        <div className='flex flex-col font-semibold'>
                            {user?.name && <p className='text-lg'>{user.name}</p>}
                            {user?.email && <p className='text-sm text-zinc-500 truncate'>{user.email}</p>}
                        </div>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem className="p-0">
                         <Link href={'/'} className="flex items-center gap-2 p-1.5 text-base w-full font-bold transition-all duration-300 hover:text-blue-500">
                            <Home className="size-4" strokeWidth={3}/> Home
                         </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem className='outline-none cursor-pointer p-0' onClick={() => signOut({callbackUrl: '/'})
                    }>
                       <span className='flex items-center gap-2 text-base w-full p-1.5 font-bold transition-all duration-300 hover:text-red-500'><LogOut className='size-4' strokeWidth={3}/>Log out </span>
                       </DropdownMenuItem>

                    </DropdownMenuContent>
                </DropdownMenu>
        </main>
}