'use client'

import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";
import UserAccountNav from "./UserAccountNav";
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X ,Plus, Search, Loader2, AlertCircle, AlertTriangle } from 'lucide-react'
import { useEffect, useRef, useState } from "react";
import { useProject } from "~/hooks/useProject";
import { twMerge } from "tailwind-merge";
import { useRouter } from 'nextjs-toploader/app';
import { useMediaQuery } from 'usehooks-ts'
import { toast } from "sonner";

export default function Searchbar() {

// const queryClient = getQueryClient()
// const queryState = queryClient.getQueryState(['getProjects'])
// const isError = queryState?.status === 'error' | 'pending' | 'success'

const [isOpen, setIsOpen] = useState(false)

// why put isError above isLoading || !projects because when isLoading or isError is true
// projects are undefined so when isError is true projects will be undefined so !projects will
// be true and you will see loaders 
const { projects , setProjectId, projectId, isLoading, isError} = useProject()

const router = useRouter()
const sidebarRef = useRef<HTMLDivElement>(null)

const [showModal, setShowModal] = useState(false)
const isLargeScreen = useMediaQuery('(min-width: 640px)')

useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    if(sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
      setIsOpen(false)
    }
  }
  document.addEventListener('mousedown', handleClickOutside)

  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [])

  return <motion.div initial={{y: -20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{duration: 0.8, type: 'spring', damping: 15, stiffness: 200, bounce: 0.3}}  className="dark:bg-transparent border-[3px] border-transparent dark:border-gray-800 bg-muted flex px-2 py-1 items-center justify-between rounded-lg">
       <div className="flex items-center gap-3">
          <Image src={'/favicon.ico'} alt='logo' width={40} height={40} />
          <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden text-foreground/60 hover:dark:bg-[#191919] hover:bg-gray-100 border p-2.5 rounded-2xl duration-200">
            {isOpen ? <X /> : <Menu />}
          </button>

           {/* {isLargeScreen && <SearchInput />} */}
          <Search onClick={() => setShowModal(true)} className="sm:hidden cursor-pointer"/>
              
       </div>

      <div className="flex items-center gap-3 sm:mr-4">
         <ThemeToggle />
         <UserAccountNav />
      </div>
     
    <AnimatePresence>
        {isOpen && (
             <motion.div ref={sidebarRef} initial={{x: '-100%'}} animate={{x: 0}} exit={{x: '-100%'}} transition={{duration: 0.4, ease: 'circInOut'}}
             className="lg:hidden absolute left-0 right-16 bottom-16 max-w-[300px] top-20 z-[200] rounded-tr-xl border-t-2 border-r-2 border-gray-700 bg-background flex flex-col gap-3 p-4">
                    <button onClick={() => {
                        router.push('/create')
                        setIsOpen(false)
                    }} className="flex-center gap-2 py-2 border-[3px] border-dashed border-zinc-600 rounded-lg hover:border-zinc-400 duration-200"><Plus />New</button>
                    
                    {/* max-h-[calc(90vh-7rem)] */}
                    <div className="flex flex-col gap-3 h-[calc(90vh-7rem)] overflow-y-scroll border-t-2 border-gray-400 pt-2">

                      {isError ? (
                          <div className="flex-center gap-2 text-red-600 font-semibold my-auto">
                             <AlertCircle />
                              Error fetching projects
                          </div>
                        ) : isLoading || !projects ?  (
                            <div className="flex justify-center items-center my-auto">
                                <div className="size-5 border-[3px] border-blue-500/30 rounded-full animate-spin border-t-blue-500"/>
                          </div>
                        ) : projects.length === 0 ? (
                          <h3 className="flex-center font-semibold my-auto text-xl">
                              Create a project
                          </h3>
                        ) : (
                          <>
                            {projects.map((project, i) => {
                                return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: i * 0.3, ease: 'easeOut' }} key={i} 
                                onClick={() => {
                                  setProjectId(project.id)
                                  // setIsOpen(false)
                                }}
                                className={twMerge("flex items-center gap-2 p-2 rounded-lg cursor-pointer border border-blue-900/2", project.id === projectId ? "bg-blue-600/15 border-blue-900" : "hover:bg-blue-600/15 duration-200")}>
                                <span className={twMerge("size-9 flex-center border rounded-sm bg-accent", project.id === projectId && "bg-blue-500 transition-colors")}>
                                {project.status === 'INDEXING' ? (
                                     <div className="size-5 border-[3px] border-yellow-500/30 rounded-full animate-spin border-t-amber-500"/>
                                        ) : project.status === 'READY' ? (
                                               project.name[0]
                                        ) : (
                                          <AlertTriangle className="size-5 text-red-500"/>
                                        )}
                                  </span>
                                <p className={twMerge("truncate text-base font-semibold", project.id === projectId && "text-blue-600", project.status === 'INDEXING' && 'animate-pulse', project.status === 'FAILED' && 'text-red-600')}>
                                  {project.name}
                                  </p>
                              </motion.div>
                            })}

                             {/* isCollapsed should be global */}
                            {/* <div className="border-4 h-[70vh]">
                               <Projects isCollapsed={isCollapsed}/>
                            </div> */}
                          </>
                        )}

                      {/* <div className="bg-red-900 h-[900px] shrink-0"></div> */}
                </div>

            </motion.div>
        )}

      </AnimatePresence>

      {/* <button onClick={async () => {
        const embeddings = await getEmbeddings(projectId)
        toast.success(embeddings)
        }} className="absolute top-1/2 left-1/2 z-50 rounded-lg p-4 bg-red-900">
                Click
            </button> */}
  </motion.div>
}