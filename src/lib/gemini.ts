import { GoogleGenerativeAI } from '@google/generative-ai'
import { Document } from '@langchain/core/documents'
import { z } from 'zod'
import chalk from 'chalk'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)
const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash'
})

export async function summarizeCommit(diff: string) {
     console.log('Summarizing commit')
     
     const response = await model.generateContent([
        `You are an expert programmer, and you are trying to summarize a git diff.
Reminders about the git diff format:
For every file, there are a few metadata lines, like (for example):
\'\'\'
diff --git a/lib/index.js b/lib/index.js
index aadf691..bfef603 100644
--- a/lib/index.js
+++ b/lib/index.js
\'\'\'
This means that \'lib/index.js\' was modified in this commit. Note that this is only an example.
Then there is a specifier of the lines that were modified:
A line starting with \'+\' means it was added.
A line starting with \'-\' means that line was deleted.
A line that starts with neither \'+\' nor \'-\' is code given for context and better understanding.
It is not part of the diff.
[...]

EXAMPLE SUMMARY COMMENTS:
\'\'\'
*Raised the amount of returned recordings from \'10\' to \'103\' [packages/server/recordings_api.ts], [packages/server/constant.ts].
*Fixed a typo in the GitHub Action name [.github/workflows/gpt-commit-summarizer.yml].
*Moved the \'octokit\' initialization to a separate file [src/octokit.ts],[src/index.ts].
*Added an OpenAI API for completions [packages/utils/apis/openai.ts].
*Lowered numeric tolerance for test files.
\'\'\'
Most commits will have fewer comments than this example list.
The last comment does not include the file names because there were more than two relevant files in the hypothetical commit.
Do not include parts of the example in your summary—it is given only as an example of appropriate comments.

Please summarize the following diff file: \n\n${diff}
`
     ])

     return response.response.text()  
}

export async function summarizeCode(doc: Document) {
    console.log('getting summary for', doc.metadata.source)
  try {
          const code = doc.pageContent.slice(0,10000)

          const response = await model.generateContent([
               `You are an intelligent senior software engineer who specialises in onboarding junior software engineers onto projects`,
               `You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file
               Here is the code:
               ---
               ${code}
               ---

               Give a summary no more than 100 words of the code above
               `
          ])

          return response.response.text()
  } catch(err) {
     console.error('Error generating summary of the code',err)
     return ''
  }
}

export async function generateEmbedding(summary: string) {
     console.log('generating embbedding of the summary')
 try {
     const model = genAI.getGenerativeModel({
          model: 'text-embedding-004'
     })
     const result = await model.embedContent(summary)
     const embedding = result.embedding

     return embedding.values
  } catch(err) {
     console.error('Error generating embedding of the summary',err)
     return []
  } 
}

const API_KEYS = [process.env.GEMINI_API_KEY_1 as string, process.env.GEMINI_API_KEY_2 as string].filter(Boolean)
const isProduction = process.env.NODE_ENV === 'production'

// Global vars
let apiKeyIndex = 0
let requestCount = 0
const modelInstances: Record<string, any> = {}

function getNextApiKey() {
//     if(!isProduction) return process.env.GEMINI_API_KEY!
    if(requestCount >= 3) {
         apiKeyIndex = (apiKeyIndex + 1) % API_KEYS.length
         requestCount = 0
    }
    requestCount++
    const key = API_KEYS[apiKeyIndex] ?? process.env.GEMINI_API_KEY!
    return key
}

function getModelForKey(apiKey: string) {
     if(!modelInstances[apiKey]) {
          console.log(chalk.green(`Creating new model instance for key: ${apiKey.slice(0,7)}`))
          const genAI = new GoogleGenerativeAI(apiKey)
          modelInstances[apiKey] = genAI.getGenerativeModel({ model: 'gemini-2.0-flash'})
     }
     return modelInstances[apiKey]
}

const filesSummarySchema = z.record(z.string().min(1), z.string())

export async function summarizeFilesBatch(docs: Document[]): Promise<string[]> {
     let modelToUse = model

     if(isProduction) {
          const apiKey = getNextApiKey()
          console.log(chalk.yellow(`Summarizing with API key: ${apiKeyIndex} - ${apiKey.slice(0,7)}`))
          modelToUse = getModelForKey(apiKey)
     }

     try {
        const prompt = `You are an intelligent senior software engineer explaining code to new team members.
       For each of the following files, provide a concise summary (max 100 words) in this exact JSON string format:
     
       {
           "path/to/file1": "summary text",
           "path/to/file2": "summary text"
       }

       Remember these points:
       -- Keys are EXACTLY these filenames: ${docs.map(d => d.metadata.source).join(', ')}
       -- For each file summary should not exceed 100 words
       -- Respond ONLY with valid JSON, no other text

       Files to summarize:

       ${docs.map(doc => `
            ${doc.metadata.source}:
            ${'```'}
            ${doc.pageContent.slice(0, 10000)}
            ${'```'}
       `).join('\n')}`

       const { response } = await modelToUse.generateContent([prompt])
       const rawResponse = response.text()

       const jsonString = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim()
       const jsonParsedData = JSON.parse(jsonString)
       const result = filesSummarySchema.safeParse(jsonParsedData)
       if(!result.success) throw new Error(`Invalid response format: ${result.error.flatten().fieldErrors}`)
     
       const batchSummaries = docs.map(doc => result.data[doc.metadata.source] || '')
       return batchSummaries

     } catch(err) {
          console.error(`Error generating summaries with API key: ${apiKeyIndex}\n`, err)
          apiKeyIndex = (apiKeyIndex + 1) % API_KEYS.length
          requestCount = 0
          console.log(chalk.red(`Switching to API key: ${apiKeyIndex}`))
          return new Array(docs.length).fill('') as string[]
          // return []
     }
}