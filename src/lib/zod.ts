import { z } from 'zod'


export const createCourseSchema = z.object({
    title: z.string().min(1, { message: 'Provide a title'}).max(30),
    units: z.array(z.string()).min(1, { message: 'Provide one unit'}).max(5, { message: 'you cannot have more than 5 units'})
})