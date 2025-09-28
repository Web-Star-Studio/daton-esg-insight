import { ReactNode, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState('fadeIn')

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fadeOut')
    }
  }, [location, displayLocation])

  const variants = {
    fadeIn: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut' as const
      }
    },
    fadeOut: {
      opacity: 0,
      y: 10,
      scale: 0.98,
      transition: {
        duration: 0.2,
        ease: 'easeOut' as const
      }
    }
  }

  return (
    <div className={cn("relative w-full", className)}>
      <AnimatePresence
        mode="wait"
        onExitComplete={() => {
          if (transitionStage === 'fadeOut') {
            setDisplayLocation(location)
            setTransitionStage('fadeIn')
          }
        }}
      >
        <motion.div
          key={displayLocation.pathname}
          initial="fadeOut"
          animate="fadeIn"
          exit="fadeOut"
          variants={variants}
          className="w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}