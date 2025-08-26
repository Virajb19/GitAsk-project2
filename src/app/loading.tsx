import { Loader } from 'lucide-react';

export default function Loading() {
    return <main className="w-full min-h-screen flex-center">
            <Loader className='size-20 text-blue-700 animate-spin' />
        </main> 
}