import { useSession } from "next-auth/react"
import { useMemo } from "react";
import { useLocalStorage } from "usehooks-ts"
import { api } from "~/trpc/react";

export const useProject = () => {
    const {data: session} = useSession();
    const userId = session?.user.id;

    const [projectId, setProjectId] = useLocalStorage<string>('projectId', "");

    const {data: projects, isLoading, isError, isFetching} = api.user.getProjects.useQuery();

    const projectCount = projects && projects.length

    const project = useMemo(() => {
        return projects?.find(project => project.id == projectId)
    }, [projects, projectId])

    return { projects, projectId, setProjectId, project, isLoading, isError, projectCount}
}