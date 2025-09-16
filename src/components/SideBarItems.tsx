import Link from "next/link"
import { usePathname } from "next/navigation"
import { twMerge } from "tailwind-merge"
import { motion } from 'framer-motion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { useMediaQuery } from 'react-responsive'

type Props = {
    items: {title: string, url: string, icon: any}[],
    isCollapsed: boolean
}

export default function SidebarItems({items, isCollapsed}: Props) {

const pathname = usePathname()
const isMobile = useMediaQuery({maxWidth: 640})

  return <>
     {items.map((item,i) => {
        return <TooltipProvider key={i}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={item.url} className={twMerge("flex items-center p-3 rounded-lg gap-5 transition-all duration-300",
                pathname === item.url ? 'bg-blue-600/15 text-blue-500' : 'hover:bg-blue-500/5 hover:text-blue-500'
                )}>
                    {item.icon}
                    {!isCollapsed && <motion.span initial={{opacity: 0}} animate={{opacity: 1}} transition={{duration: 0.3, ease: 'easeInOut'}}
                    className="text-lg font-semibold tracking-wide">{item.title}</motion.span>}
                </Link>
                </TooltipTrigger>
                {isCollapsed && (
                    <TooltipContent side={isMobile ? 'top' : 'right'} sideOffset={12}>
                        <p>{item.title}</p>
                    </TooltipContent>
                )}
        </Tooltip>
        </TooltipProvider>
     })}
  </>
}