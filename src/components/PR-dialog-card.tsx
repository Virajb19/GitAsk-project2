import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { GitPullRequest, ClipboardList, ScanSearch, Scan, RefreshCw, AlertTriangle, CheckCircle, Files, Plus, Minus, BarChart, Bug, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "~/components/ui/form";
import { z } from 'zod'
import { analyzePRSchema } from "~/lib/zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useProject } from "~/hooks/useProject";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { useState } from "react";
import { LuGithub } from "react-icons/lu";
import Link from "next/link";

const schema = z.object({
    prNumber: z.string().min(1, "PR Number is required")
  });

type Input = z.infer<typeof schema>

export default function PRDialogCard() {

    const { project } = useProject()

    const [open, setOpen] = useState(false)

    // toast.success(project?.repoURL)

    const form = useForm<Input>({
        resolver: zodResolver(schema),
    })

    const analyze = api.project.analyzePR.useMutation({
        onSuccess: () => {
            toast.success('Analysis complete', {position: 'bottom-right'})
        },
        onError: (err) => {
           console.log(err)
           toast.error('Error analyzing PR', {position: 'bottom-right'})
        }
    })

    async function onSubmit(data: Input) {
         console.log('Submitted')
         toast.info('You will be charged 5 credits for each PR analysis', {position: 'bottom-right', duration: 3000})
         await analyze.mutateAsync({githubRepoUrl: project?.repoURL ?? "", PRnumber: data.prNumber})
         setOpen(true)
    }

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
         <DialogContent>
            <DialogHeader>
                <DialogTitle className="text-xl font-semibold flex items-center justify-center gap-2 uppercase underline underline-offset-4">
                    <GitPullRequest className="w-5 h-5 text-blue-400" strokeWidth={3} />
                    Pull Request Analysis
                </DialogTitle>
            </DialogHeader>

            {analyze.data && (
                <div className="flex justify-center mb-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="px-6 py-4 rounded-2xl shadow-xl bg-card border border-blue-300"
                >
                    <div className="flex items-center gap-3">

                    {analyze.data.score > 70 ? (
                         <motion.div animate={{ rotate: [0,7,-7,0]}} transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 0.5}}>
                            <AlertTriangle className="w-8 h-8 text-red-600" strokeWidth={3} />
                         </motion.div>
                    ) : analyze.data.score > 40 ? (
                          <motion.div animate={{ rotate: [0,7,-7,0]}} transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 0.5}}>
                            <AlertTriangle className="w-8 h-8 text-yellow-400" strokeWidth={3} />
                         </motion.div>
                    ) : (
                        <CheckCircle className="w-8 h-8 text-green-500" strokeWidth={3} />
                    )} 

                    <h2 className="text-3xl font-bold">
                        {analyze.data.score ?? 100}/100
                        
                    </h2>
                    </div>

                    <p className="text-center text-sm text-white mt-1 font-medium">
                       Overall Risk Score
                    </p>
                </motion.div>
                </div>
            )}

   <Link
        target="_blank" rel="noopener noreferrer"
        href={`${project?.repoURL}/pull/${form.watch("prNumber") ?? ""}` ?? "#"}
        className="bg-gray-900 hover:bg-black duration-200 text-white py-2 px-4 rounded-xl transition-all text-sm text-white/80 hover:underline inline-flex items-center font-medium gap-2 group"
        >
        <LuGithub className="w-5 h-5" strokeWidth={2.5} />
            {`${project?.repoURL}/pull/${form.watch("prNumber") ?? ""}` ?? 'No Link found'}
        <ExternalLink className="size-5 group-hover:translate-x-1 group-hover:-translate-y-1 duration-300"/>
    </Link>

            <div className="grid grid-cols-2 gap-7">
                <ResultItem icon={<Files />} label="Files Changed" value={analyze.data?.components.fileCount ?? "—"} />
                <ResultItem icon={<Plus />} label="Total Additions" value={analyze.data?.components.totalAdditions ?? "—"} />
                <ResultItem icon={<Minus />} label="Total Deletions" value={analyze.data?.components.totalDeletions ?? "—"} />
                <ResultItem icon={<BarChart />} label="Avg Churn" value={analyze.data?.components.avgChurn ?? "—"} />
                <ResultItem icon={<Bug />} label="Past Bugs" value={analyze.data?.components.totalBugHits ?? "—"} />
            </div>

         </DialogContent>
    </Dialog>
    <div className="flex-center col-span-2">
        <Card className="shadow-xl rounded-2xl flex flex-col items-center justify-center w-full">
                <CardHeader className="flex flex-col items-center"> 
                    <CardTitle className="flex items-center gap-2">
                        <motion.span animate={{rotate: [0, 90, 90, 180, 180, 270, 270, 360]}} style={{display: "inline-block"}} transition={{duration: 3, repeat: Infinity, ease: 'linear'}}>
                        <GitPullRequest className="w-5 h-5 text-blue-300" strokeWidth={3}/>
                        </motion.span>
                        <h4 className="uppercase font-bold">Pull request tools</h4>
                    </CardTitle>
                    <CardDescription className="text-lg font-semibold text-center">Enter PR number to run analysis</CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col items-center w-full">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex flex-col items-center w-full">
                                <FormField
                                    name="prNumber"
                                    render={({field}) => ( 
                                    <FormItem className="flex flex-col gap-1 items-start w-full">
                                        <FormLabel className="text-xl font-semibold">PR Number</FormLabel>
                                        <FormControl>
                                            <input {...field} type="text" placeholder="e.g. 42" className="input-style w-full" />
                                        </FormControl>
                                       <FormMessage className="text-base text-red-500 font-semibold"/>
                                    </FormItem>
                                    )}
                                    />

                                <motion.button type="submit" disabled={form.formState.isSubmitting} className={twMerge("flex items-center p-2 gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors duration-200 text-lg font-semibold disabled:cursor-not-allowed disabled:opacity-75",
                                    form.formState.isSubmitting && "animate-pulse duration-1000"
                                )}>
                                    {form.formState.isSubmitting ? (
                                        <>
                                        <RefreshCw className="text-blue-200 animate-spin"/> Analyzing...
                                        </>
                                    ) : (
                                        <>
                                        <ScanSearch className="text-amber-200" strokeWidth={3}/> Analyze
                                        </>
                                    )} 
                                </motion.button>
                            </form>
                    </Form>
                </CardContent>
        </Card>
      </div>
    </>
  );
}


function ResultItem({
    icon,
    label,
    value
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
  }) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="p-3 rounded-xl border-4 duration-200 border-blue-600 bg-card flex flex-col items-center shadow-sm"
      >
        <div className="text-blue-400">{icon}</div>
        <p className="text-lg font-bold">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </motion.div>
    );
  }