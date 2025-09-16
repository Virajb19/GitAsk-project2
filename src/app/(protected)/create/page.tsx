'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { createProjectSchema } from "~/lib/zod"
import { motion } from 'framer-motion'
import { Loader, ArrowRight, Info, FileText, Key } from 'lucide-react'
import { LuGithub } from "react-icons/lu";
import axios, { AxiosError } from 'axios'
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { useProject } from "~/hooks/useProject"
import { useRouter } from "nextjs-toploader/app"
import { checkCredits, checkRepoExists, updateProjectStatus } from "~/server/actions"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { useMutation } from "@tanstack/react-query"
import { useIsRefetching } from "~/lib/store"
import { api } from "~/trpc/react"

type Input = z.infer<typeof createProjectSchema>

export default function CreatePage() {

  const form = useForm<Input>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: 'Project', repoURL: 'https://github.com/owner/repo'}
  })

  const [creditInfo, setCreditInfo] = useState({ fileCount: 0, userCredits: 0})

  const queryClient = useQueryClient()
  const { projectId, setProjectId } = useProject()
  const router = useRouter()
  const utils = api.useUtils();

  const {data: session} = useSession()
  const userId = session?.user.id
  const credits = session?.user.credits

  const { setIsRefetching } = useIsRefetching()

   const indexProject = api.project.index.useMutation({
    onSuccess: () => toast.success("Project indexed successfully", { position: "bottom-right" }),
    onError: (err) => {
      console.error(err);
      toast.error("Error indexing the project");
    },
    onSettled: async (_, __, variables) => {
      if (process.env.NEXT_PUBLIC_NODE_ENV === "production") {
        await updateProjectStatus("READY", variables.projectId);
      }
      await utils.user.getProjects.invalidate();
    },
  });

  const createProject = api.project.create.useMutation({
    onSuccess: async ({ projectId, repoURL }) => {
      toast.success("Successfully created the project", { position: "bottom-right" });
      form.reset();
      await utils.user.getProjects.refetch();
      setProjectId(projectId);
      router.push("/dashboard");
      setTimeout(() => toast.info("Initializing project. Please wait...", { position: "top-center" }), 3000);

      indexProject.mutate({ projectId, repoURL });
    },
    onError: (err) => {
      console.error(err);
      toast.error(err.message || "Something went wrong", { position: "bottom-right" });
    },
    onMutate: () => setIsRefetching(false),
    onSettled: () => setIsRefetching(true),
  });

  async function onSubmit(data: Input) {

          const repoExists = await checkRepoExists(data.repoURL)
          if (!repoExists) {
            form.setError('repoURL', { message: 'This repository does not exist' })
            return
          }

          const { fileCount, userCredits } = await checkCredits(data.repoURL, data.githubToken)
          setCreditInfo({fileCount, userCredits}) 

          if(userCredits > fileCount) { 
              await createProject.mutateAsync({...data, fileCount})
              // createProject.mutate({...data, fileCount});
          } else toast.error(`You need to buy ${fileCount - userCredits} more credits`, {position: 'bottom-right'})
   }

  return <div className="grow flex-center gap-3">
        <Image src={'/github.svg'} alt="github" width={300} height={300} className="mb:hidden"/>
        <motion.div initial={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}} transition={{duration: 0.5, ease: 'easeInOut'}} className="mb:w-[90%]">
            <Card className="shadow-lg shadow-blue-600">
                <CardHeader>
                    <CardTitle className="text-xl uppercase">Link your Github Repository</CardTitle>
                    <CardDescription className="font-semibold">Enter the URL of your Github Repository to link it to GitAsk</CardDescription>
                </CardHeader>
                  <CardContent>
                     <Form {...form}>
                        <form className="space-y-7" onSubmit={form.handleSubmit(onSubmit)}>
                            
                        <FormField
                          control={form.control}
                          name='name'
                          render={({ field }) => (
                             <FormItem className='flex flex-col gap-1'>
                              <FormLabel className="font-semibold">Project name</FormLabel>
                              <FormControl>
                                   <div className="flex items-center gap-2 p-2 rounded-xl border focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent duration-200">
                                       <div className="shrink-0">
                                        <FileText />
                                       </div>
                                      <input className='outline-none bg-transparent grow mb:text-sm' placeholder='Enter your project name' {...field}/>                                      
                                   </div>
                              </FormControl>
                              <FormMessage className="font-semibold"/>
                             </FormItem>
                          )}
                        />

                    <FormField
                          control={form.control}
                          name='repoURL'
                          render={({ field }) => (
                             <FormItem className='flex flex-col gap-1'>
                              <FormLabel className="font-semibold">Repo URL</FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-2 p-2 rounded-xl border focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent duration-200">
                                   <div className="shrink-0">
                                     <LuGithub className="size-5"/>
                                   </div>
                                   <input className='outline-none bg-transparent grow mb:text-sm' placeholder='Enter your repo URL' {...field}/>
                                </div>
                              </FormControl>
                              <FormMessage className="font-semibold"/>
                             </FormItem>
                          )}
                        />

                    <FormField
                          control={form.control}
                          name='githubToken'
                          render={({ field }) => (
                             <FormItem className='flex flex-col gap-1'>
                              <FormLabel className="font-semibold">Github Token</FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-2 p-2 rounded-xl border focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent duration-200">
                                   <div className="shrink-0">
                                     <Key />
                                   </div>
                                  <input className='outline-none bg-transparent grow mb:text-sm overflow-hidden' placeholder='optional (for private repositories)' {...field}/>
                                </div>
                              </FormControl>
                              <FormMessage />
                             </FormItem>
                          )}
                        />

                       {(creditInfo.fileCount > 0 || creditInfo.userCredits > 0) && (
                          <motion.div initial={{opacity: 0}} animate={{opacity: 1}} transition={{duration: 0.4, ease: 'easeInOut'}}
                          className="border p-3 rounded-md bg-orange-100 dark:bg-orange-200/5 border-yellow-500">
                          <div className="flex gap-3 text-yellow-800">
                             <Info />
                             <p>You will be charged <strong>{creditInfo.fileCount}</strong> credits for this project</p>
                          </div>
                          <p className="text-blue-600 ml-9">You currently have <strong>{creditInfo.userCredits}</strong> in your account</p>
                       </motion.div>
                      )}

                       <button type="submit" disabled={form.formState.isSubmitting}
                        className="bg-blue-700 mx-auto group px-3 py-2 rounded-lg font-semibold text-white flex-center gap-3 cursor-pointer disabled:cursor-not-allowed disabled:opacity-75">
                          {form.formState.isSubmitting && <Loader className="animate-spin"/>}
                           {form.formState.isSubmitting ? 'Please wait...' : 
                           <>
                             Create project <ArrowRight className="group-hover:translate-x-2 duration-200"/>
                           </>}                   
                       </button>
                      
                     </form>
                     </Form>
                  </CardContent>
            </Card>
        </motion.div>
  </div>
}