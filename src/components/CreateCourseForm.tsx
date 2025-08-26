'use client'

import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from 'zod' 
import { createCourseSchema } from "~/lib/zod";
import { motion, AnimatePresence} from 'framer-motion'
import { Plus, Trash } from 'lucide-react'
import { twMerge } from "tailwind-merge";

type Input = z.infer<typeof createCourseSchema>

export default function CreateCourseForm() {

  const form = useForm<Input>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: { title: '', units: ['','','']}
  })

  async function onSubmit(data: Input) {

  }

  form.watch()

  return <div className="w-1/2 mb:w-full border">
          <Form {...form}>
               <form className="flex flex-col px-4" onSubmit={form.handleSubmit(onSubmit)}>
                    <FormField
                          control={form.control}
                          name="title"
                          render={({ field, fieldState }) => (
                            <FormItem className="flex mb:flex-col mb:items-start items-center p-1">
                              <FormLabel className="flex-[1] text-2xl font-semibold">Title</FormLabel>
                              <FormControl className="flex-[6] mb:w-full">
                                <input className={twMerge("input-style", fieldState.error && 'focus:border-red-700')} placeholder="Enter the main topic of the course(e.g. 'Calculus')" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                      <AnimatePresence>
                          {form.watch('units').map((_,i) => {
                            return <motion.div key={i} initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}} transition={{duration: 0.2, ease: 'easeInOut'}}>
                                     <FormField
                                        control={form.control}
                                        name={`units.${i}`}
                                        render={({ field }) => (
                                          <FormItem className="flex mb:flex-col mb:items-start items-center p-1">
                                            <FormLabel className="flex-[1] text-2xl font-semibold">Unit {i + 1}</FormLabel>
                                            <FormControl className="flex-[6] mb:w-full">
                                              <input className="input-style" placeholder="Enter subtopic of the course(e.g. 'What is differentiation?')" {...field} />
                                            </FormControl>
                                          </FormItem>
                                        )}
                                    />
                            </motion.div>
                          })}
                      </AnimatePresence>

                       <div className="flex-center gap-2 text-lg font-semibold my-4">
                            <button onClick={() => form.setValue('units', [...form.watch('units'), ""])} type="button" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10">
                                <Plus className="text-green-500" strokeWidth={3}/> Add unit 
                            </button>

                            <button onClick={() => form.setValue('units', form.watch('units').slice(0,-1))} type="button" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10">
                                 <Trash className="text-red-500" strokeWidth={3}/>  Remove unit
                            </button>
                       </div>

                       <button type="submit" className="font-bold w-3/4 mb:w-full mx-auto py-2 bg-white text-black rounded-sm">
                             Let's Go!
                       </button>
                    
               </form>
          </Form>
  </div>
}