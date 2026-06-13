import React from 'react'
import { Globe, Clock } from 'lucide-react'
import toggleIcon from '../assets/icons/icon32.png'

interface FocusPageProps {
  isActive: boolean
  onToggle: () => void
}

export function FocusPage({ isActive, onToggle }: FocusPageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 animate-fade-in">
      <div className="relative mb-8">
        <button
          onClick={onToggle}
          className={`relative w-24 h-12 rounded-full transition-all duration-500 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            isActive
              ? 'bg-primary shadow-[0_0_20px_rgba(245,158,11,0.3)]'
              : 'bg-secondary border border-border'
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-10 h-10 rounded-full bg-white shadow-md transition-all duration-500 flex items-center justify-center ${
              isActive ? 'translate-x-12' : 'translate-x-0'
            }`}
          >
            <img src={toggleIcon} alt="OddGuard" className="w-6 h-6" />
          </span>
        </button>
      </div>

      <div className="text-center space-y-2">
        <h2
          className={`text-2xl font-bold tracking-tight transition-colors duration-500 ${
            isActive ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          {isActive ? 'FOCUS ARMED' : 'FOCUS DISARMED'}
        </h2>
        <p className="text-sm text-muted-foreground max-w-[200px]">
          {isActive
            ? 'Distraction sites will be intercepted'
            : 'Toggle on to block distractions'}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 w-full max-w-[280px]">
        <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Sites</p>
            <p>Blocked domains</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Timer</p>
            <p>Friction delay</p>
          </div>
        </div>
      </div>
    </div>
  )
}
