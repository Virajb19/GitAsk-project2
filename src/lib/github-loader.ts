import { GithubRepoLoader } from '@langchain/community/document_loaders/web/github'
import { generateEmbedding, summarizeCode, summarizeFilesBatch } from './gemini'
import { db } from '~/server/db'
import chalk from 'chalk'

const BATCH_SIZE = Number(process.env.BATCH_SIZE) || 30
const MAX_RUNS = 7

const isProduction = process.env.NODE_ENV === 'production'

export async function loadGithubRepo(githubURL: string, githubToken?: string) {

  const loader = new GithubRepoLoader(githubURL, {
    accessToken: githubToken ?? process.env.GITHUB_ACCESS_TOKEN,
    branch: 'main',
    ignoreFiles: ['pnpm-lock.yaml','package-lock.json','migration.sql'],
    recursive: true,
    unknown: 'warn',
    maxConcurrency: 5
  })

  const docs = await loader.load()
  return docs
}

export async function indexGithubRepo(projectId: string, githubURL: string, githubToken?: string) {
  const docs = await loadGithubRepo(githubURL, githubToken)

   const embeddings = await Promise.all(docs.map(async doc => {
     const summary = await summarizeCode(doc)
     const embedding = await generateEmbedding(summary)

      return {
        summaryEmbedding: embedding,
        sourceCode: JSON.parse(JSON.stringify(doc.pageContent)) as string,
        filename: doc.metadata.source,
        summary
      }
     }))

    await Promise.allSettled(embeddings.map(async embedding => {
      const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
        data: {
          sourceCode: embedding.sourceCode,
          filename: embedding.filename,
          summary: embedding.summary,
          projectId
        },
        select: { id: true}
      })

      await db.$executeRaw`
      UPDATE "SourceCodeEmbedding"
      SET "summaryEmbedding" = ${embedding.summaryEmbedding}::vector
      WHERE id = ${sourceCodeEmbedding.id}
      `
  }))
}

export async function startIndexing(projectId: string, githubURL: string) {

    let runCount = 0

     async function indexGithubRepo() {

         try {

              runCount++
              console.log(chalk.cyanBright(`Indexing repository: ${runCount}`))

              const docsWithoutSummary = await db.sourceCodeEmbedding.findMany({where: {projectId, summary: ''}, select: {filename: true}})
              console.log('docs without summary', docsWithoutSummary.length)

              const docsCount = await db.sourceCodeEmbedding.count({where: { projectId }})
              const isAlldocsSummarized = docsWithoutSummary.length === 0 && docsCount > 0

              if(isAlldocsSummarized) {
                console.log('All documents are summarized. Stopping recursion.')
                await db.project.update({where: {id: projectId}, data: { status: 'READY'}})
                return
              }

              const docs = await loadGithubRepo(githubURL)
              console.log(`Total docs: ${docs.length}`)

              const unprocessedFiles = new Set(docsWithoutSummary.map(d => d.filename))
              const docsToSummarize = unprocessedFiles.size === 0 ? docs : docs.filter(doc => unprocessedFiles.has(doc.metadata.source))
              
              if(docsToSummarize.length === 0) {
                console.log('No more documents to summarize. Stopping recursion.')
                await db.project.update({where: {id: projectId}, data: { status: 'READY'}})
                return
              }
        
              let summaries: string[] = []

              for(let i=0; i < docsToSummarize.length; i += BATCH_SIZE) {
                const batch = docsToSummarize.slice(i, i + BATCH_SIZE)
      
                console.log('Summarizing the batch', i, ' - ', i + BATCH_SIZE)
                const batchSummaries = await summarizeFilesBatch(batch)
      
                summaries.push(...batchSummaries)
          
                if(batchSummaries.every(summary => summary === '')) {
                  console.log(chalk.blue('waiting 20 seconds...'))
                  await new Promise(r => setTimeout(r, (isProduction ? 7 : 20) * 1000))
                }
            }

              const embeddings = await Promise.all(docsToSummarize.map(async (doc,i) => {
                const embedding = await generateEmbedding(summaries[i] ?? '')
          
                return {
                  summaryEmbedding: embedding,
                  sourceCode: JSON.parse(JSON.stringify(doc.pageContent)) as string,
                  filename: doc.metadata.source,
                  summary: summaries[i] ?? ''
                }
              }))

                await Promise.allSettled(embeddings.map(async (embedding) => {
                  const sourceCodeEmbedding = await db.sourceCodeEmbedding.upsert({
                    where: { filename_projectId: {filename: embedding.filename, projectId}},
                    update: { summary: embedding.summary},
                    create: {
                      sourceCode: embedding.sourceCode,
                      filename: embedding.filename,
                      summary: embedding.summary,
                      projectId
                    },
                    select: { id: true}
                  })

                  await db.$executeRaw`
                  UPDATE "SourceCodeEmbedding"
                  SET "summaryEmbedding" = ${embedding.summaryEmbedding}::vector
                  WHERE id = ${sourceCodeEmbedding.id}
                  `
              }))

              if (runCount < MAX_RUNS) {
                console.log(chalk.blue('Waiting for 10 seconds before next run...'))
                await new Promise(r => setTimeout(r, 1000 * (isProduction ? 5 : 10)))
                await indexGithubRepo()
              } else {
                console.log(chalk.bgMagenta('Maximum run count reached. Stopping indexing.Marking as READY'))
                await db.project.update({where: {id: projectId}, data: { status: 'READY'}})
                return
              }

        } catch(err) {
          console.error(chalk.red('Error indexing repo\n', err))
          await db.project.update({where: {id: projectId}, data: { status: 'FAILED'}})
          return 
        }
     }

    await indexGithubRepo()
}

