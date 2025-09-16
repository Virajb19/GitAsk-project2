'use server'

import { db } from "~/server/db"
import { auth } from "~/server/auth"
import { getOctokitClient } from "~/lib/github";
import axios from "axios";
import { ProjectStatus } from "@prisma/client";

const octokit = getOctokitClient()

export async function checkCredits(githubURL: string, githubToken?: string) {

    const session = await auth()
    if(!session?.user) throw new Error('Unauthorized') 
    const userId = parseInt(session.user.id);

    const [owner, repo] = githubURL.split('/').slice(-2)
    if(!owner || !repo) throw new Error('Invalid github url')
    const fileCount = await countFiles('', owner, repo)

    const user = await db.user.findUnique({where: {id: userId}, select: {credits: true}})
    
    return { fileCount, userCredits: user?.credits || 0}
}


export async function checkRepoExists(repoURL: string) {
    const [owner, repo] = repoURL.split('/').slice(-2)
    try {
        const headers = { Authorization: `token ${process.env.GITHUB_ACCESS_TOKEN}` }
        await axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers })
        return true
    } catch(err) {
        return false
    }
}

async function countFiles(path: string, owner: string, repo: string, acc: number = 0) {

    const { data } = await octokit.rest.repos.getContent({owner, repo, path})

    if(!Array.isArray(data) && data.type === 'file') acc++

    if(Array.isArray(data)) {
      let fileCount: number = 0
      let directories: string[] = []

        for (const item of data) {
            if(item.type === 'dir') directories.push(item.path)
            else if(item.type === 'file') fileCount++
        }

        if(directories.length > 0) {
            const directoryCounts = await Promise.all(directories.map(async dir => {
                return await countFiles(dir, owner, repo)
            }))
            fileCount += directoryCounts.reduce((acc,count) => acc + count, 0)
        }
        return fileCount + acc;
    }
    return acc;
}

export async function updateProjectStatus(status: ProjectStatus, projectId: string) {
    const session = await auth()
    if(!session?.user) throw new Error('Unauthorized') 

    await db.project.update({where: {id: projectId}, data: {status}})
}