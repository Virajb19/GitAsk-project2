'use client'

import { motion } from 'framer-motion'

export default function FloatingShapes() {
  return <>
      <motion.div initial={{x: 0, y: 0}} animate={{x: 'calc(100vw - 5rem)', y: 'calc(100vh - 5rem)'}} transition={{duration: 30, delay: 2, ease: 'linear', repeat: Infinity, repeatType: 'reverse'}} className="absolute mb:hidden top-7 left-3 size-28 rounded-full bg-blue-600 blur-xl"/> 
      <motion.div initial={{x: 0, y: 0, rotate: 0}} animate={{x: '-30vw', y: '30vh', rotate: 360}} transition={{duration: 30, delay: 3, ease: 'linear', repeat: Infinity, repeatType: 'reverse'}} className="absolute mb:hidden top-2 right-3 size-64 rounded-full bg-blue-600 blur-xl"/> 
      <motion.div initial={{x: 0, y: 0}} animate={{x: '30vw', y: '-30vh'}} transition={{duration: 30, ease: 'linear', repeat: Infinity, repeatType: 'reverse'}} className="absolute mb:hidden bottom-3 left-3 size-48 rounded-full bg-blue-600 blur-xl"/> 
</>
}