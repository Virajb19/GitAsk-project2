import { redirect } from "next/navigation";
import CreateCourseForm from "~/components/CreateCourseForm";
import { auth } from "~/server/auth";
import { InfoIcon, Zap } from 'lucide-react'
import { Progress } from "~/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger} from '~/components/ui/tooltip'

export default async function CreatePage() {

  const session = await auth()
  if(!session || !session.user) return redirect('/')

  return <div className="w-full border-4 flex flex-col items-center p-1">
      <h1 className="text-6xl mb:text-4xl font-bold">Learning Journey</h1>
       <div className="flex items-center mb:items-start gap-3 bg-secondary rounded-sm w-1/2 mb:w-full text-bsse font-semibold my-4 p-2">
          <InfoIcon className="text-blue-600 size-12"/>
           <p>
            Enter in a course title, or what you want to learn about. Then enter a
            list of units, which are the specifics you want to learn. And our AI
            will generate a course for you!
           </p>
       </div>
        <CreateCourseForm />
        <div className="flex flex-col items-center gap-2 bg-secondary p-2 border-4 w-1/5 mt-5 rounded-md">
          <Progress value={10} className="bg-white/10"/>
         <Tooltip>
            <TooltipTrigger>
                  <button className="flex-center gap-2 px-4 py-2 font-bold text-xl rounded-lg bg-gradient-to-tr from-green-600 to-blue-500 hover:from-green-500 hover:to-blue-600 duration-300">
                    <Zap strokeWidth={3} className="fill-white"/> Upgrade
                </button>
            </TooltipTrigger>
            <TooltipContent sideOffset={10} side="top" className="border-[3px] rounded-sm text-lg font-semibold border-white">
                   Upgrade to get more generations!
            </TooltipContent>
         </Tooltip>
        </div>
  </div>
}