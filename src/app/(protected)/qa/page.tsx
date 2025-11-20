'use client'

import { Question } from "@prisma/client";
import MDEditor from "@uiw/react-md-editor";
import Image from "next/image";
import { Fragment, useMemo, useState } from "react";
import AskQuestionCard from "~/components/AskQuestionCard";
import FileReference from "~/components/file-reference";
import { Sheet,SheetContent,SheetHeader,SheetTitle,SheetTrigger} from "~/components/ui/sheet";
import { Skeleton } from "~/components/ui/skeleton";
import { useProject } from "~/hooks/useProject";
import { motion } from 'framer-motion'
import { User } from "lucide-react";
import DeleteButton from "~/components/DeleteButton";
import { useSearchQuery } from "~/lib/store";
import { api } from "~/trpc/react";
import { toast } from "sonner"

export type question = Question & { user: { ProfilePicture: string | null}}

export default function QApage() {

  const [quesIdx, setQuesIdx] = useState(0)

  const { projectId } = useProject()
  const { query } = useSearchQuery()
 
const {data: questions, isLoading, isError} = api.project.getQuestions.useQuery({projectId}, {refetchIntervalInBackground: true, refetchInterval: 5 * 60 * 1000, staleTime: 5 * 60 * 1000})

    const filteredQuestions = useMemo(() => {
      const words = query.toLowerCase().split(' ')
      return questions?.filter(question => words.every(word => question.question.toLowerCase().includes(word))) ?? []
  }, [questions, query])

  if(isError) return <div className="flex flex-col grow mt-3 p-1">
     <AskQuestionCard />
     <h3 className="self-center my-auto text-2xl text-red-600">No questions found. Refresh!!!</h3> 
</div>

  // || use isFetching
  if(isLoading || !questions) return <div className="w-full flex flex-col gap-3 p-1">
                <AskQuestionCard />
                <h3 className="font-bold underline">Saved Questions</h3>
                {Array.from({length: 5}).map((_,i) => {
                    return <Skeleton key={i} className="h-[10vh]"/>
                })}
          </div>

  // toast.success(JSON.stringify(questions))

  if(questions.length === 0) return <div className="flex flex-col grow mt-3 p-1">
       <AskQuestionCard />
       <h3 className="self-center my-auto text-3xl">Ask a Question!</h3> 
  </div>
          
  const question = filteredQuestions?.[quesIdx]

  return <div className="w-full flex flex-col gap-3 p-1">
          <AskQuestionCard />
         <Sheet>
              <h3 className="font-bold underline">Saved Questions</h3>
               {(questions && questions.length > 0) ? (
                 <>
                     {filteredQuestions.map((question, i) => {

                       const ProfilePicture = question.user.ProfilePicture

                        return <Fragment key={question.id}>
                          <SheetTrigger onClick={() => setQuesIdx(i)}>
                              <motion.div initial={{opacity: 0}} animate={{opacity: 1}} transition={{duration: 0.3, ease: 'easeInOut', delay: i * 0.1}}
                              className="flex group items-start lg:items-center justify-between gap-3 p-3 rounded-lg bg-card text-left border hover:border-blue-600 duration-200">
                                {ProfilePicture ? (
                                  <Image src={question.user.ProfilePicture ?? ''} alt="user" width={50} height={50} className="rounded-full mb:hidden"/>
                                ) : (
                                    <div className="p-3 flex-center size-12 rounded-full bg-gradient-to-b from-blue-400 to-blue-700">
                                      <User className="size-6" />
                                </div>
                                )}
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-5">
                                    <p className="text-lg line-clamp-1 font-semibold">Q{i + 1}. {question.question}</p>
                                    <span className="whitespace-nowrap text-base font-semibold text-gray-500">{new Date(question.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm line-clamp-5 overflow-hidden sm:line-clamp-2 text-gray-400 w-[70vw]">{question.answer}</p>
                                  </div>

                               <DeleteButton questionId={question.id}/>

                              </motion.div>
                          </SheetTrigger>
                      </Fragment>
              })}
                 </>
               ) : (
                  <h2 className="self-center my-auto">Ask a Question</h2>
               )}
                {question && (
                    <SheetContent className="sm:max-w-[60vw] w-full z-[1000]">
                    <SheetHeader>
                       <SheetTitle className="capitalize underline">Q.{question.question}</SheetTitle>
                       <MDEditor.Markdown source={question.answer} className="max-h-[40vh] overflow-scroll"/>
                       <FileReference files={(question.filesReferences ?? []) as any}/>
                    </SheetHeader>
                </SheetContent>
                )}
         </Sheet>
  </div>
}