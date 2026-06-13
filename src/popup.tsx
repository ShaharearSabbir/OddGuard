import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { AppState, Project } from './types'
import { FocusPage } from './pages/FocusPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { SettingsPage } from './pages/SettingsPage'
import { Menu, Shield, FolderKanban, Settings, Link } from 'lucide-react'
import './index.css'

const navItems = [
  { id: 'focus', label: 'Focus', icon: Shield },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const

type PageId = (typeof navItems)[number]['id']

function Popup() {
  const [state, setState] = useState<AppState>({
    isFocusModeActive: false,
    defaultTimerDuration: 10,
    projects: [],
    activeProjectId: null,
    blocklist: [],
  })
  const [menuOpen, setMenuOpen] = useState(false)
  const [page, setPage] = useState<PageId>('focus')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chrome.storage.local.get(null, (r) => setState(r as unknown as AppState))
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const update = (patch: Partial<AppState>) => {
    chrome.storage.local.set(patch)
    setState((prev) => ({ ...prev, ...patch }))
  }

  const addProject = (p: Project) =>
    update({ projects: [...state.projects, p] })

  const deleteProject = (id: string) =>
    update({
      projects: state.projects.filter((p) => p.id !== id),
      activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
    })

  const setActiveProject = (id: string) =>
    update({ activeProjectId: state.activeProjectId === id ? null : id })

  const addDomain = (d: string) =>
    update({ blocklist: [...state.blocklist, d] })

  const removeDomain = (d: string) =>
    update({ blocklist: state.blocklist.filter((x) => x !== d) })

  const toggleFocus = () =>
    update({ isFocusModeActive: !state.isFocusModeActive })

  const navigate = (id: PageId) => {
    setPage(id)
    setMenuOpen(false)
  }

  const NavIcon = navItems.find((n) => n.id === page)!.icon

  return (
    <div className="w-[380px] min-h-[440px] flex flex-col bg-background relative">
      <header className="flex items-center justify-between px-3 h-10 border-b border-border shrink-0">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-secondary transition-colors"
        >
          <Menu className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-1.5">
          <NavIcon className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {navItems.find((n) => n.id === page)!.label}
          </span>
        </div>

        <div className="w-7" />
      </header>

      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute top-10 left-0 w-44 z-50 bg-card border border-border rounded-xl shadow-xl animate-scale-in p-1.5"
        >
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                  page === item.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {page === 'focus' && (
          <FocusPage isActive={state.isFocusModeActive} onToggle={toggleFocus} />
        )}
        {page === 'projects' && (
          <ProjectsPage
            projects={state.projects}
            activeProjectId={state.activeProjectId}
            onSetActive={setActiveProject}
            onDelete={deleteProject}
            onAdd={addProject}
          />
        )}
        {page === 'settings' && (
          <SettingsPage
            timerDuration={state.defaultTimerDuration}
            onTimerChange={(v) => update({ defaultTimerDuration: v })}
            blocklist={state.blocklist}
            onAddDomain={addDomain}
            onRemoveDomain={removeDomain}
          />
        )}
      </div>

      <footer className="flex items-center justify-center gap-3 px-3 py-2 border-t border-border shrink-0">
        <span className="text-[10px] text-muted-foreground">Shaharear Sabbir</span>
        <span className="text-[10px] text-muted-foreground/40">|</span>
        <a
          href="https://github.com/ShaharearSabbir"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground/60 hover:text-foreground transition-colors"
          title="GitHub"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
        </a>
        <a
          href="https://www.linkedin.com/in/shaharearrahmansabbir/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground/60 hover:text-foreground transition-colors"
          title="LinkedIn"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </a>
      </footer>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Popup />)
