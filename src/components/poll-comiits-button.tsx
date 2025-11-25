import { GitGraph, RefreshCw } from 'lucide-react';
import { useTransition } from 'react';
import { useProject } from '~/hooks/useProject';
import { api } from '~/trpc/react';

export default function PollCommitsButton() {

  const [isPending, startTransition] = useTransition();

  const utils = api.useUtils();

  const { projectId } = useProject();

  const handleClick = () => {
    startTransition(async () => {
         await utils.project.getCommits.refetch({projectId})
    })
  }

  return <button disabled={isPending} onClick={handleClick}
      className='bg-blue-700 px-3 py-2 flex items-center gap-2 text-base text-gray-300 hover:text-gray-100 duration-300 font-semibold rounded-lg disabled:cursor-not-allowed disabled:opacity-70'>
        {isPending ? (
          <>
            <RefreshCw className='animate-spin size-5'/> Polling...
          </>
        ) : (
           <>
           <GitGraph className='size-5'/> Poll Commits
           </>
        )}
  </button>
}