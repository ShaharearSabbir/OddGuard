export interface Task {
  id: string
  text: string
  completed: boolean
}

export interface Project {
  id: string
  name: string
  goal: string
  deadline: string | null
  tasks: Task[]
}

export interface AppState {
  isFocusModeActive: boolean
  defaultTimerDuration: number
  projects: Project[]
  activeProjectId: string | null
  blocklist: string[]
}

export interface AllowBypassMessage {
  type: 'allowBypass'
  domain: string
}

export interface CheckBypassMessage {
  type: 'checkBypass'
  domain: string
}
