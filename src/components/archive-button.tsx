import { Trash, Loader2 } from 'lucide-react'
import { useProject } from "~/hooks/useProject";
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios, { AxiosError } from "axios";
import { toast } from 'sonner';
import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from "./ui/dialog";
import { useState } from 'react';
import { api } from '~/trpc/react';

export default function ArchiveButton() {

    const { projectId, setProjectId, projects, project } = useProject()

    const [open, setOpen] = useState(false)
    const queryClient = useQueryClient()

   // const deleteProject = useMutation({
   //    mutationFn: async (projectId: string) => {
   //       const res = await axios.delete(`/api/project/${projectId}`)
   //       return res.data
   //    },
   //    onSuccess: () => {
   //       toast.success('Project deleted')
   //       // const projects = queryClient.getQueryData<Project[]>(['getProjects'])
   //       const nextProject = projects?.find(p => p.id !== projectId)
   //       if(projects?.length) {
   //          setProjectId(nextProject?.id ?? '')
   //       }
   //    },
   //    onError: (err) => {
   //       console.error(err)
   //       if(err instanceof AxiosError) {
   //          toast.error(err.response?.data.msg || 'Something went wrong!')
   //       }
   //    },
   //    onSettled: () => {
   //       queryClient.refetchQueries({queryKey: ['getProjects']})
   //       queryClient.refetchQueries({queryKey: ['getCommits']})
   //    }
   // })

   const utils = api.useUtils();

   const deleteProject = api.project.delete.useMutation({
      onSuccess: () => {
         toast.success('Project deleted')
         const nextProject = projects?.find(p => p.id !== projectId)
         if(projects?.length) {
            setProjectId(nextProject?.id ?? '')
         }
      }, 
      onError: (err) => {
         console.error(err);
         toast.error(err.message);
      },
      onSettled: () => {
         utils.user.getProjects.refetch()
         utils.project.getCommits.refetch({projectId})
      }
   })

  return <Dialog open={open} onOpenChange={val => {
      if(!deleteProject.isPending) setOpen(val) // --> (|| true and && false) to make statement true and false
    }}>
        <DialogTrigger>
                  <button onClick={() => {
                        // const confirm = window.confirm('Are you sure you want to archive this project?')
                        // if(confirm) archiveProject(projectId)
                     }} 
                     disabled={deleteProject.isPending || project?.status === 'INDEXING' || projects?.length === 0} className="bg-red-800 hover:bg-red-700 px-3 py-2 flex items-center gap-2 text-base text-gray-300 hover:text-gray-100 duration-300 font-semibold rounded-lg disabled:cursor-not-allowed disabled:opacity-70">
                  {deleteProject.isPending ? (
                     <>
                     <Loader2 strokeWidth={3} className="animate-spin size-5"/> Deleting...
                     </>
                  ) : (
                     <>
                        <Trash strokeWidth={3} className="size-5"/> Delete project
                     </>
                  )}
            </button>
        </DialogTrigger>
        <DialogContent>
             <DialogHeader className='font-semibold text-lg sm:text-xl text-left uppercase'>Are you sure you want to delete this project?</DialogHeader>
             <div className="flex items-center gap-3 justify-end font-semibold">
                 <button disabled={deleteProject.isPending} onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg bg-blue-600 disabled:opacity-80">Cancel</button>
                 <button onClick={() => {
                    setOpen(false)
                    deleteProject.mutate({projectId})
                 }} disabled={projects?.length === 0 || deleteProject.isPending} className="px-4 py-2 flex-center gap-2 rounded-lg bg-red-600 hover:bg-red-500 duration-300 disabled:cursor-not-allowed disabled:opacity-70">

                     {deleteProject.isPending ? (
                        <>
                           <Loader2 strokeWidth={3} className="animate-spin size-5"/> Deleting...
                        </>
                     ) : (
                        "Delete"
                     )}
                 </button>
             </div>
        </DialogContent>
  </Dialog>
}