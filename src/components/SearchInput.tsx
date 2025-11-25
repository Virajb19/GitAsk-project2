import { Search, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useDebounceCallback } from 'usehooks-ts'
import { useSearchQuery } from "~/lib/store";

export default function SearchInput() {

 const searchRef = useRef<HTMLInputElement>(null)

 const { query, setQuery} = useSearchQuery()
 const debounced = useDebounceCallback(setQuery, 300)

 useEffect(() => {
     if(searchRef.current) searchRef.current.value = query
 }, [])

  return  <div className="flex items-center gap-2">
               <div className="flex items-center mb:w-full bg-white dark:bg-[#2B2A33] rounded-lg px-2 border-2 border-transparent focus-within:border-blue-600 duration-200">
                    <Search /> 
                    <input id="search" ref={searchRef} onChange={(e) => debounced(e.target.value)} className="outline-none p-2 bg-transparent" placeholder="Search..."/>
                </div>
              {query.length > 0 && (
                <button onClick={() => {   
                  setQuery('')
                  // const input = document.getElementById('search') as HTMLInputElement
                  // if(input) input.value = ''
                  if(searchRef.current) searchRef.current.value = ''
                }} style={{visibility: query.length > 0 ? 'visible' : 'hidden'}} className="p-1.5 mb:hidden rounded-full hover:bg-red-500/10 hover:text-red-500 duration-200">
                  <X className="size-5"/>
            </button>
         )}
  </div>
}