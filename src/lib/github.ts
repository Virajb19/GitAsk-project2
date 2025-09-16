import { Octokit } from 'octokit'
import { summarizeCommit } from './gemini'
import axios from 'axios'
import { db } from '~/server/db'

let octokit: Octokit | null = null;

export const getOctokitClient = (): Octokit => {
  if (!octokit) {
    octokit = new Octokit({
      auth: process.env.GITHUB_ACCESS_TOKEN,
    });
  }
  return octokit;
}

type Response = {
   message: string,
   hash: string,
   authorName: string,
   authorAvatar: string,
   date: string
}

export async function getCommits(githubURL: string): Promise<Response[]> {

   const [owner, repo] = githubURL.split('/').slice(-2)
   if(!owner || !repo) throw new Error('Invalid Github URL')
   const octokit = getOctokitClient()
       
    const { data } = await octokit.rest.repos.listCommits({owner,repo})

    const sortedCommits = data.sort((a: any,b: any) => new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime())

       const commits = sortedCommits.slice(0,15).map(commit => ({
        message: commit.commit.message,
        hash: commit.sha,
        authorName: commit.commit.author?.name ?? '',
        authorAvatar: commit.author?.avatar_url ?? '',
        date: commit.commit.author?.date ?? ''
    }))
 
    return commits
 }

export async function pollCommits(projectId: string, repoURL: string) {

   const commits = await getCommits(repoURL)

   // existingCommits
   const processedCommits = await db.commit.findMany({ where: { projectId}, orderBy: { date: 'desc'}, select: { hash: true}})  

   const existingHashes = new Set(processedCommits.map(c => c.hash))
   const newCommits = commits.filter(commit => !existingHashes.has(commit.hash))

   // newCommits
   const unprocessedCommits = commits.filter(commit => !processedCommits.some((processedCommit) => processedCommit.hash === commit.hash))
   
   if(unprocessedCommits.length === 0) return 0

   const responses = await Promise.allSettled(unprocessedCommits.map(async (commit) => {
      const { data } = await axios.get(`${repoURL}/commit/${commit?.hash}.diff`, { headers: { Accept: 'application/vnd.github.v3.diff'}})
      const summary = await summarizeCommit(data) || ""
      return summary
   }))

   const summaries = responses.map(response => response.status === 'fulfilled' ? response.value : '')

   const commitsToDelete = await db.commit.findMany({where: {projectId}, orderBy: {date: 'asc'}, select: { id: true}, take: unprocessedCommits.length})
   await db.commit.deleteMany({where: {id: { in: commitsToDelete.map(commit => commit.id)}}})

  const Commits = await db.commit.createMany({
      data: unprocessedCommits.map((commit, i) => ({
         message: commit.message,
         hash: commit.hash,
         authorName: commit.authorName,
         authorAvatar: commit.authorAvatar,
         date: commit.date,
         summary: summaries[i] ?? '',
         projectId
      }))
   })
   return Commits.count
}
