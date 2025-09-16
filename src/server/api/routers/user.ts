import { SignUpSchema } from '~/lib/zod';
import bcrypt from 'bcrypt'
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from '@trpc/server';

export const userRouter = createTRPCRouter({
     signup: publicProcedure.input(SignUpSchema).mutation(async ({ ctx, input}) => {

           const { username, email, password} = input

           const userExists = await ctx.db.user.findUnique({ where: { email }, select: { id: true}})
           if(userExists) throw new TRPCError({ code: 'FORBIDDEN', message: 'user already exists'})

           const hashedPassword = await bcrypt.hash(password,10)
           await ctx.db.user.create({data: {username,email,password: hashedPassword}})

           return { message: 'signed up successfully'}
     }),
     getProjects: protectedProcedure.query(async ({ctx}) => {
          return await ctx.db.project.findMany({where: {userId: parseInt(ctx.session.user.id)}, orderBy: {createdAt: 'desc'}});
     })
})