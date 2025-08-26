'use client'

import React from 'react';
import Link from 'next/link';
import { Button } from '../components/ui/button';
import {Home, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'

const NotFound = () => {
  return (
    <div className="flex-center absolute inset-0">
      <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <motion.div animate={{ rotate: [0,7,-7,0]}} transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 0.5}}>
           <AlertTriangle className='size-24 text-yellow-500 mb-2'/>
        </motion.div>
        <h1 className="mb-4 text-4xl font-bold tracking-tighter text-primary md:text-6xl">
          404 - Page Not Found
        </h1>
        <p className="mb-8 text-lg text-muted-foreground md:text-xl">
          Oops! The page you're looking for doesn't exist.
        </p>
        <Button size="lg" className='font-semibold py-2 px-4'>
          <Home className='h-5 w-5' strokeWidth={3}/>
          <Link href="/">Go Back Home</Link>
        </Button>
      </main>
    </div>
  );
};

export default NotFound;