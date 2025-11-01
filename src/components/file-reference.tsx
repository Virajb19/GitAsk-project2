import { useState } from 'react'
import {Tabs, TabsContent} from './ui/tabs'
import { Prism } from 'react-syntax-highlighter'
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { twMerge } from 'tailwind-merge'

type Props = {
    files: { filename: string, sourceCode: string, summary: string} []
}

export default function FileReference({files}: Props) {
 
    const [tab,setTab] = useState(files[0]?.filename)

  return <div className='max-w-[67vw] mb:max-w-[90vw]'>
           <Tabs value={tab} onValueChange={setTab}>
                <div className='flex gap-2 bg-gray-800 overflow-scroll rounded-md p-2'>
                   {files.map((file,i) => {
                     return <button onClick={() => setTab(file.filename)} className={twMerge('whitespace-nowrap duration-200 px-3 py-2 rounded-md font-semibold transition-colors ease-in-out', 
                    tab === file.filename ? ' text-black dark:text-primary-foreground bg-sidebar-primary-foreground' : 'text-muted-foreground border border-zinc-600 hover:text-primary hover:border-transparent hover:bg-gray-700')} key={i}>{file.filename}</button>
                   })}
                </div>
                {files.map(file => {
                    return <TabsContent key={file.filename} value={file.filename} className='max-h-[40vh] max-w-7xl rounded-sm overflow-scroll'>
                        <Prism language='typescript' style={materialDark}>
                           {file.sourceCode}
                        </Prism>
                    </TabsContent>
                })}
           </Tabs>
  </div>
}