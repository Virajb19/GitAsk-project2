import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { GitPullRequest, ClipboardList, ScanSearch, Scan } from "lucide-react";
import { motion } from "framer-motion";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "~/components/ui/form";
import { z } from 'zod'
import { analyzePRSchema } from "~/lib/zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type Input = z.infer<typeof analyzePRSchema>

export default function PRDialogCard() {

    const form = useForm<Input>({
        resolver: zodResolver(analyzePRSchema)
    })

    async function onSubmit(data: Input) {

    }

  return (
      <Card className="shadow-xl rounded-2xl col-span-2 flex flex-col items-center justify-center">
             <CardHeader className="flex flex-col items-center"> 
                <CardTitle className="flex items-center gap-2">
                    <motion.span animate={{rotate: [0, 90, 90, 180, 180, 270, 270, 360]}} style={{display: "inline-block"}} transition={{duration: 3, repeat: Infinity, ease: 'linear'}}>
                       <GitPullRequest className="w-5 h-5 text-blue-300" strokeWidth={3}/>
                    </motion.span>
                    <h4 className="uppercase font-bold">Pull request tools</h4>
                </CardTitle>
                <CardDescription className="text-lg font-semibold text-center">Open the dialog to provide PR information and run analysis</CardDescription>
             </CardHeader>

             <CardContent className="flex flex-col items-center">
                    <Dialog>
                          <DialogTrigger>
                               <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                    <button className="rounded-xl text-white font-semibold p-2 text-center bg-blue-600 flex items-center gap-2">
                                        <ClipboardList className="text-amber-300"/>
                                        Open PR Dialog
                                    </button>
                                </motion.div>
                          </DialogTrigger>

                          <DialogContent>
                               <DialogHeader>
                                    <DialogTitle className="text-xl font-semibold flex items-center justify-center gap-2 uppercase">
                                        <GitPullRequest className="w-5 h-5 text-blue-400" strokeWidth={3}/> 
                                         <p className="underline-offset-2 underline">Enter PR Information</p>
                                    </DialogTitle>
                               </DialogHeader>

                                <Form {...form}>
                                      <form className="space-y-4 flex flex-col items-center">
                                          <FormField
                                                name="prNumber"
                                                render={() => ( 
                                                <FormItem className="flex flex-col gap-1 items-start w-full">
                                                    <FormLabel className="text-xl font-semibold">PR Number</FormLabel>
                                                    <FormControl>
                                                       <input type="text" placeholder="e.g. 42" className="input-style w-full" />
                                                    </FormControl>
                                                <FormMessage />
                                                </FormItem>
                                                )}
                                                />

                                            <motion.button className="flex items-center p-2 gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 duration-150 text-lg font-semibold">
                                                 <ScanSearch className="text-amber-200" strokeWidth={3}/> Analyze
                                            </motion.button>
                                      </form>
                                </Form>
                          </DialogContent>
                    </Dialog>
             </CardContent>
      </Card>
  );
}


