import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useProject } from "~/hooks/useProject"
import { question } from '~/app/(protected)/qa/page'

export default function DeleteButton({questionId}: {questionId: string}) {

    const queryClient = useQueryClient()
    const { projectId } = useProject()

   const {mutate: deleteQuestion, isPending} = useMutation({
        mutationFn: async (questionId: string) => {
            const res = await axios.delete(`/api/question/${questionId}`)
            return res.data
        },
        onMutate: (questionId: string) => {
           queryClient.cancelQueries({ queryKey: ['getQuestions']})
           const prevQuestions = queryClient.getQueryData<question[]>(['getQuestions', projectId])
           queryClient.setQueryData(['getQuestions',projectId], (oldQuestions: question[]) => {
              return oldQuestions.filter(question => question.id !== questionId)
           })
           return { prevQuestions }
        },
        onSuccess: () => {
             toast.success('Deleted', { position: 'bottom-left'})
        },
        onError: (err,questionId,context) => {
           console.error(err)
           toast.error('Something went wrong!')
           queryClient.setQueryData(['getQuestions', projectId], context?.prevQuestions)
        },
        onSettled: () => {
            // queryClient.refetchQueries({ queryKey: ['getQuestions']})
            // queryClient.invalidateQueries({ queryKey: ['getQuestions', projectId]})
        }
      })
    
  return  <button onClick={(e) => {
             e.preventDefault()
             deleteQuestion(questionId)
          }} disabled={isPending} className="p-1.5 rounded-lg lg:opacity-0 lg:group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-500 duration-200 disabled:cursor-not-allowed disabled:opacity-100 disabled:hover:bg-transparent">
            {isPending ? (
                <div className="size-5 border-[3px] border-red-500/30 rounded-full animate-spin border-t-red-500"/>
            ) : (
                <Trash2 className="size-5"/>
            )}
</button>
}