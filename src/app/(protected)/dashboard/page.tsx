'use client'

import { useProject } from "~/hooks/useProject"
import { ExternalLink, ArrowUp} from 'lucide-react'
import Link from "next/link"
import CommitLogComponent from "~/components/commit-log"
import AskQuestionCard from "~/components/AskQuestionCard"
import { LuGithub } from "react-icons/lu";
import ArchiveButton from "~/components/archive-button"
import PollCommitsButton from "~/components/poll-comiits-button"
import PRDialogCard from "~/components/PR-dialog-card"

export default function DashBoard() {

  const { project } = useProject()

  return <div id="dashboard" className="w-full flex flex-col gap-1 p-3 mb:p-0">
    <div className="flex flex-wrap gap-3 p-1 items-center justify-between">
      <div className="flex justify-between gap-3 items-center bg-blue-700 rounded-sm px-5 py-3 text-white/80">
        <LuGithub className="size-6" />
        <p className="flex flex-wrap items-center gap-2 font-semibold">This project is linked to
          <Link target="_blank" rel="noopener noreferrer" href={project?.repoURL ?? '#'} className="text-sm text-white/80 hover:underline inline-flex items-center font-semibold gap-2 group">
          {project?.repoURL || 'No repository link'}
          <ExternalLink className="size-5 group-hover:translate-x-1 group-hover:-translate-y-1 duration-300"/>
          </Link>
        </p>
      </div>

         <div className="flex gap-2 items-center">
            <PollCommitsButton />
            <ArchiveButton />
         </div>
    </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5 mt-1">
          <AskQuestionCard />
          <PRDialogCard />
      </div>

       <CommitLogComponent />
     
  </div>
}