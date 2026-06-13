import React, { useState } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Clock, Globe, Plus, Trash2 } from 'lucide-react'

interface SettingsPageProps {
  timerDuration: number
  onTimerChange: (v: number) => void
  blocklist: string[]
  onAddDomain: (d: string) => void
  onRemoveDomain: (d: string) => void
}

export function SettingsPage({
  timerDuration,
  onTimerChange,
  blocklist,
  onAddDomain,
  onRemoveDomain,
}: SettingsPageProps) {
  const [domainInput, setDomainInput] = useState('')

  const add = () => {
    const d = domainInput.trim().toLowerCase()
    if (d && !blocklist.includes(d)) {
      onAddDomain(d)
      setDomainInput('')
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <h2 className="text-base font-semibold tracking-tight">Settings</h2>

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Friction Timer (seconds)
        </Label>
        <Input
          type="number"
          value={timerDuration}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10)
            if (!isNaN(v) && v > 0) onTimerChange(v)
          }}
          min={1}
          className="h-9"
        />
        <p className="text-[11px] text-muted-foreground">
          Countdown delay before bypass is available
        </p>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Globe className="h-4 w-4 text-muted-foreground" />
          Blocked Domains
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="example.com"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            className="h-9 text-sm flex-1"
          />
          <Button variant="outline" size="sm" onClick={add} className="h-9 gap-1">
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
        <div className="space-y-1 max-h-[200px] overflow-y-auto">
          {blocklist.map((domain) => (
            <div
              key={domain}
              className="group flex items-center justify-between rounded-md border border-border px-3 py-1.5 hover:border-primary/30 transition-all duration-200"
            >
              <span className="text-sm text-foreground/90">{domain}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemoveDomain(domain)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
          {blocklist.length === 0 && (
            <p className="text-xs text-muted-foreground italic py-3 text-center">
              No domains blocked
            </p>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-border">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          OddGuard v1.0
        </p>
      </div>
    </div>
  )
}
