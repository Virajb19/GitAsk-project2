import { createProjectSchema } from '~/lib/zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { pollCommits } from '~/lib/github';
import { startIndexing } from '~/lib/github-loader';

const bodySchema = createProjectSchema.extend({
    fileCount: z.number()
  })

const indexBodySchema = createProjectSchema.omit({name: true}).extend({projectId: z.string().cuid()});

export const projectRouter = createTRPCRouter({
     create: protectedProcedure.input(bodySchema).mutation(async ({ctx, input}) => {

        const userId = parseInt(ctx.session.user.id);

        const user = await ctx.db.user.findUnique({ where: { id: userId}, select: { credits: true}})
        if(!user) throw new TRPCError({code: 'NOT_FOUND', message: 'user not found'});

        const {fileCount, name, repoURL, githubToken} = input;

        if(fileCount > user.credits) throw new TRPCError({code: 'BAD_REQUEST', message: 'Insufficient credits'});


        const existingProject = await ctx.db.project.findFirst({where: {repoURL,userId}})
        if(existingProject)  throw new TRPCError({code: 'BAD_REQUEST', message: 'You already have a project with this repo URL'});

        const project = await ctx.db.project.create({data: {name,repoURL,githubToken,userId}, select: {id: true, repoURL: true}});

        try {
            await pollCommits(project.id, project.repoURL)
          } catch(err) {
              console.error(err)
              await ctx.db.project.delete({where: {id: project.id}})
              throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: 'Error creating the project'})
          }
      
          await ctx.db.user.update({where: {id: userId}, data: {credits: {decrement: fileCount}}});

          return {projectId: project.id, repoURL: project.repoURL};
     }),
     delete: protectedProcedure.input(z.object({projectId: z.string().cuid()})).mutation(async ({ctx, input}) => {
          const { projectId } = input;
          const project = await ctx.db.project.findUnique({ where: { id: projectId}, select: { id: true}})
          if(!project) throw new TRPCError({code: 'NOT_FOUND', message: 'project not found'});
          await ctx.db.project.delete({ where: { id: project.id}})
          return {msg: 'Project deleted'};
     }),
     index: protectedProcedure.input(indexBodySchema).mutation(async ({ctx, input}) => {
           const { projectId, repoURL, githubToken} = input;
           const project = await ctx.db.project.findUnique({ where: { id: projectId}, select: { id: true}})
           if(!project) throw new TRPCError({code: 'NOT_FOUND', message: 'project not found'});

           await startIndexing(project.id, repoURL);
           return {msg: 'Project indexed successfully'}
     }),
     getCommits: protectedProcedure.input(z.object({projectId: z.string().cuid()})).query(async ({ctx, input}) => {
          const { projectId } = input;

          const project = await ctx.db.project.findUnique({ where: { id: projectId}, select: { id: true, repoURL: true}})
          if(!project) throw new TRPCError({code: 'NOT_FOUND', message: 'project not found'});

          const commits = await ctx.db.commit.findMany({where: { projectId}, orderBy: { date: 'desc'}})
          await pollCommits(project.id, project.repoURL)
          
          return commits;
     }),
     getQuestions: protectedProcedure.input(z.object({projectId: z.string().cuid()})).query(async ({ctx, input}) => {
          const { projectId } = input;

          const project = await ctx.db.project.findUnique({ where: { id: projectId}, select: { id: true, repoURL: true}})
          if(!project) throw new TRPCError({code: 'NOT_FOUND', message: 'project not found'});

         const questions = await ctx.db.question.findMany({where: {id: projectId}, orderBy: {createdAt: 'desc'}, include: {user: {select: {ProfilePicture: true}}}})    
         return questions      
     }),
     deleteQuestion: protectedProcedure.input(z.object({questionId: z.string().cuid()})).mutation(async ({ctx, input}) => {
            const {questionId} = input

            const question = await ctx.db.question.findUnique({where: {id: questionId}, select: {id: true}})
            if(!question) throw new TRPCError({code: 'NOT_FOUND', message: 'question not found'})

           await ctx.db.
     })
  
})