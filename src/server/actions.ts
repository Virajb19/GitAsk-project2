'use server'

import { db } from "~/server/db"
import { auth } from "~/server/auth"
import { getOctokitClient } from "~/lib/github";
import axios from "axios";
import { ProjectStatus } from "@prisma/client";
import { streamText, generateText } from 'ai'
import { createStreamableValue } from 'ai/rsc'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateEmbedding } from "~/lib/gemini";

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

const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY as string})

export async function askQuestion(question: string, projectId: string) {
    const stream = createStreamableValue()

    // const { textStream } = streamText({
    //     model: google('gemini-1.5-flash'),
    //     prompt: `Translate the following question to English and output only the translated question, and do add the coding keywords(login,schema etc) that question might correspond to. The Question is:"${question}"`,
    // })

    // let translatedQuestion = ''
    // for await (const text of textStream) {
    //     translatedQuestion += text
    // }

    // console.log('Translated question: ', translatedQuestion)

    // const queryEmbedding = await generateEmbedding(translatedQuestion)

    const queryEmbedding = await generateEmbedding(question)
    const vectorQuery = `[${queryEmbedding.join(',')}]`

    const result = await db.$queryRaw`
     SELECT "filename", "sourceCode", "summary",
      1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
     FROM "SourceCodeEmbedding"
     WHERE  1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > 0.5
     AND "projectId" = ${projectId}
     ORDER BY similarity DESC
     LIMIT 10 
    ` as { filename: string, sourceCode: string, summary: string} []

    console.log('Similar files: ', result.length)

    let context = ''

    for(const doc of result) {
         context += `source: ${doc.filename}\ncode content: ${doc.sourceCode}\n summary of file: ${doc.summary}\n\n`
    }

    (async () => {
         const { textStream } = streamText({
            model: google('gemini-2.0-flash'),
            prompt: `You are a AI code assistant who answers questions about the codebase. Your target audience is a technical intern who is learning to work with the code
                 AI Assistant is a brand new, powerful, human-like artificial intelligence.
            The traits of AI include expert intelligence, helpfulness, cleverness and articulateness.
            AI is well-behaved and well mannered individual.
            AI is always friendly, kind and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
            AI has the sum of all knowledge in their brain and is able to accurately answer nearly any question about any topic in the world.
            If the question is about code or a specific file, AI will provide the detailed answer, giving step by step instructions about the code
            START CONTEXT BLOCK
            ${context}
            END OF CONTEXT BLOCK

            START QUESTION
            ${question}
            END OF QUESTION
            AI Assistant will take into account any CONTEXT BLOCK that is provided in a conversation
            If the context does not provide the answer to the question, the AI will say "I am sorry, but I dont know the answer of that question!!"
            AI Assistant will not apologize for the previous responses, but instead will indicated new information was gained.
            AI Assistant will not invent anything that is not drawn directly from the context.
            Answer in markdown syntax, with code snippets if needed. Be as detailed as possible while answering, make sure there is no wrong answer.

            MOST IMPORTANT 
            Give answers in points and new point should start from next line.
            Every point should have a serial number at the start 
            `,
         })

         for await (const text of textStream) {
            stream.update(text)
         }

         stream.done()
    })()

    return {
         output: stream.value,
         fileReferences: result
}
}

export async function saveQuestion(question: string, answer: string, projectId: string, filesReferences: any) {
    try {

     const session = await auth()
     if(!session?.user) return {success: false, msg: 'Unauthorized'}
     const userId = parseInt(session.user.id);

     const existingQuestion = await db.question.findFirst({where: {answer, projectId}})
     if(existingQuestion) return { success: false, msg: 'Question already saved'}

     await db.question.create({data: {question, answer, projectId, userId, filesReferences}})

     return {success: true, msg: 'Question saved successfully'}

    } catch(err) {
        console.error('Error saving question',err)
        return {success: false, error: 'Error saving question!'}
    }
}