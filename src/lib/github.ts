import { Octokit } from 'octokit'
import { summarizeCommit } from './gemini'
import axios from 'axios'
import { db } from '~/server/db'
import { NumberSchema } from '@google/generative-ai';

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

   const processedCommits = await db.commit.findMany({ where: { projectId}, orderBy: { date: 'desc'}, select: { hash: true}})  

   const unprocessedCommits = commits.filter(commit => !processedCommits.some((processedCommit) => processedCommit.hash === commit.hash))
   
   if(unprocessedCommits.length === 0) return 0

   const responses = await Promise.allSettled(unprocessedCommits.map(async (commit, i) => {
      const { data } = await axios.get(`${repoURL}/commit/${commit?.hash}.diff`, { headers: { Accept: 'application/vnd.github.v3.diff'}})
      const summary = await summarizeCommit(data) || ""
      console.log(`Summary - ${i} :`, summary)
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

const CONFIG = {
   filesCap: 20,
   linesCap: 500,
   churnCap: 50,
   bugCap: 10,
 
   weights: {
     files: 2.0,
     lines: 0.8,
     churn: 1.2,
     bugs: 2.0
   }
 };

 function clamp01(v: number) {
   return Math.max(0, Math.min(1, v));
 }

 async function getFileChurn(githubURL: string, path: string, cap: number = CONFIG.churnCap) {

        try {
               const [owner, repo] = githubURL.split('/').slice(-2)
               if(!owner || !repo) throw new Error('Invalid Github URL')
               const octokit = getOctokitClient()

               const res = await octokit.rest.repos.listCommits({owner, repo, path, per_page: 100})
               const count = Array.isArray(res.data) ? res.data.length : 0;
               return Math.min(count, cap);
        } catch(err) {
             return 0;
        }
 }

 async function getBugFileHistory(githubURL: string, path: string, cap: number = CONFIG.bugCap) {
        try {
            const [owner, repo] = githubURL.split('/').slice(-2)
            if(!owner || !repo) throw new Error('Invalid Github URL')
            const octokit = getOctokitClient()

            const res = await octokit.rest.repos.listCommits({owner, repo, path , per_page: 100})

            const commits = res.data || [];
            let bugCount = 0;

            for(const c of commits) {
               const msg = (c.commit.message || "").toLowerCase()
               if(msg.includes("fix") || msg.includes("bug") || msg.includes("patch") || msg.includes("hotfix")) {
                  bugCount++;
                  if(bugCount >= cap) break;
               }
            }
            return Math.min(bugCount, cap)

        } catch(err) {
            return 0
        }
 }

 export async function computePrRisk(githubURL: string, prNumber: number) {

      const [owner, repo] = githubURL.split('/').slice(-2)
      if(!owner || !repo) throw new Error('Invalid Github URL')
      const octokit = getOctokitClient()

     const filesRes = await octokit.rest.pulls.listFiles({owner, repo, pull_number: prNumber, per_page: 100})

     const files = filesRes.data || [];
     if (files.length === 0) {
       return { score: 0, components: {}, message: "No files changed" };
     }

     const fileCount = files.length;
     let totalAdditions = 0;
     let totalDeletions = 0;

     for(const f of files) {
         totalAdditions += f.additions || 0;
         totalDeletions += f.deletions || 0;
     }

     const totalLines = totalAdditions + totalDeletions;

     const churns = await Promise.all(files.map(f => getFileChurn(githubURL, f.filename)))
     const bugs = await Promise.all(files.map(f => getBugFileHistory(githubURL, f.filename)))

     const avgChurn = churns.length ? churns.reduce((acc, c) => acc + c, 0) / churns.length : 0
     const totalBugHits = bugs.reduce((a, b) => a + b, 0);

     const filesNorm = clamp01(fileCount / CONFIG.filesCap);
     const linesNorm = clamp01(totalLines / CONFIG.linesCap);
     const churnNorm = clamp01(avgChurn / CONFIG.churnCap);
     const bugNorm = clamp01(totalBugHits / CONFIG.bugCap);

     const w = CONFIG.weights;
     const rawScore = w.files * filesNorm + w.lines * linesNorm + w.churn * churnNorm + w.bugs * bugNorm;

     const theoreticalMax = w.files + w.lines + w.churn + w.bugs;
     const score = Math.round((rawScore / theoreticalMax) * 100);


  return {
         score,
         components: {
         fileCount,
         totalAdditions,
         totalDeletions,
         totalLines,
         avgChurn,
         churnNorm,
         totalBugHits,
         bugNorm,
         rawScore,
         }
      };
 } 


 
