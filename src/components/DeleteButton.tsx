import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useProject } from "~/hooks/useProject"
import { question } from '~/app/(protected)/qa/page'
import { api } from "~/trpc/react"

export default function DeleteButton({questionId}: {questionId: string}) {

    const queryClient = useQueryClient()
    const { projectId } = useProject()

    const utils = api.useUtils()

 const deleteQuestion = api.project.deleteQuestion.useMutation({
    onMutate: async ({questionId}) => {
        await utils.project.getQuestions.cancel({ projectId })

        const prevQuestions = utils.project.getQuestions.getData({ projectId })
        utils.project.getQuestions.setData({projectId}, old => old ? old.filter(q => q.id != questionId) : [])

        return {prevQuestions}
    },
    onSuccess: () => {
        toast.success('Deleted', { position: 'bottom-left' })
    },
    onError: (_err, _variables, context) => {
        toast.error('Something went wrong!')
        if (context?.prevQuestions) {
          utils.project.getQuestions.setData({ projectId }, context.prevQuestions)
        }
    },
    // onSettled: () => {
    //     utils.project.getQuestions.invalidate({ projectId })
    //  }

 })
    
  return  <button onClick={(e) => {
             e.preventDefault()
             deleteQuestion.mutate({questionId})
          }} disabled={deleteQuestion.isPending} className="p-1.5 rounded-lg lg:opacity-0 lg:group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-500 duration-200 disabled:cursor-not-allowed disabled:opacity-100 disabled:hover:bg-transparent">
            {deleteQuestion.isPending ? (
                <div className="size-5 border-[3px] border-red-500/30 rounded-full animate-spin border-t-red-500"/>
            ) : (
                <Trash2 className="size-5"/>
            )}
</button>
}