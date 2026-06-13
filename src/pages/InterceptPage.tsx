import React, { useState, useEffect, useCallback, useRef } from "react";
import { AppState, Task, Project } from "../types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { generateId, formatDeadlineRemaining } from "../lib/utils";
import {
  Timer,
  Target,
  ListTodo,
  Plus,
  Trash2,
  ChevronRight,
  Clock,
  Flag,
  Brain,
  Check,
  X,
} from "lucide-react";
import logoIcon from "../assets/icons/icon32.png";

export function InterceptPage() {
  const params = new URLSearchParams(window.location.search);
  const targetDomain = params.get("target") || "unknown";

  const [state, setState] = useState<AppState | null>(null);
  const [timer, setTimer] = useState<number | null>(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectGoal, setNewProjectGoal] = useState("");
  const [newProjectDeadline, setNewProjectDeadline] = useState("");
  const [bypassEnabled, setBypassEnabled] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [now, setNow] = useState(Date.now());
  const [checkingBypass, setCheckingBypass] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chrome.runtime.sendMessage(
      { type: "checkBypass", domain: targetDomain },
      (response) => {
        if (response?.bypassed) {
          const protocol = targetDomain.startsWith("http") ? "" : "https://";
          window.location.href = `${protocol}${targetDomain}`;
        } else {
          setCheckingBypass(false);
        }
      },
    );
  }, [targetDomain]);

  useEffect(() => {
    if (checkingBypass) return;
    chrome.storage.local.get(null, (result) => {
      const s = result as unknown as AppState;
      setState(s);
      setTimer(s.defaultTimerDuration);
    });
    chrome.storage.onChanged.addListener((changes) => {
      if ("activeProjectId" in changes || "projects" in changes) {
        chrome.storage.local.get(null, (result) => {
          setState(result as unknown as AppState);
        });
      }
    });
  }, [checkingBypass]);

  useEffect(() => {
    if (timer === null || timer <= 0 || checkingBypass) return;
    const id = setInterval(() => {
      setTimer((prev) => {
        if (prev === null || prev <= 1) {
          setBypassEnabled(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timer, checkingBypass]);

  useEffect(() => {
    if (checkingBypass) return;
    if (!state?.projects.find((p) => p.id === state.activeProjectId)?.deadline)
      return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state?.activeProjectId, state?.projects, checkingBypass]);

  const handleBypass = useCallback(() => {
    chrome.runtime.sendMessage({ type: "allowBypass", domain: targetDomain });
  }, [targetDomain]);

  const activeProject = state
    ? (state.projects.find((p) => p.id === state.activeProjectId) ?? null)
    : null;

  const setActiveProjectId = (projectId: string) => {
    if (!state) return;
    chrome.storage.local.set({ activeProjectId: projectId });
    setState({ ...state, activeProjectId: projectId });
  };

  const addProject = () => {
    if (!state || !newProjectName.trim()) return;
    const project: Project = {
      id: generateId(),
      name: newProjectName.trim(),
      goal: newProjectGoal.trim(),
      deadline: newProjectDeadline || null,
      tasks: [],
    };
    const updatedProjects = [...state.projects, project];
    chrome.storage.local.set({
      projects: updatedProjects,
      activeProjectId: project.id,
    });
    setState({
      ...state,
      projects: updatedProjects,
      activeProjectId: project.id,
    });
    setNewProjectName("");
    setNewProjectGoal("");
    setNewProjectDeadline("");
    setShowAddProject(false);
  };

  const addTask = () => {
    if (!state || !activeProject || !newTaskText.trim()) return;
    const task: Task = {
      id: generateId(),
      text: newTaskText.trim(),
      completed: false,
    };
    const updatedProjects = state.projects.map((p) =>
      p.id === activeProject.id ? { ...p, tasks: [...p.tasks, task] } : p,
    );
    chrome.storage.local.set({ projects: updatedProjects });
    setState({ ...state, projects: updatedProjects });
    setNewTaskText("");
  };

  const toggleTask = (taskId: string) => {
    if (!state || !activeProject) return;
    const updatedProjects = state.projects.map((p) =>
      p.id === activeProject.id
        ? {
            ...p,
            tasks: p.tasks.map((t) =>
              t.id === taskId ? { ...t, completed: !t.completed } : t,
            ),
          }
        : p,
    );
    chrome.storage.local.set({ projects: updatedProjects });
    setState({ ...state, projects: updatedProjects });
  };

  const deleteTask = (taskId: string) => {
    if (!state || !activeProject) return;
    const updatedProjects = state.projects.map((p) =>
      p.id === activeProject.id
        ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }
        : p,
    );
    chrome.storage.local.set({ projects: updatedProjects });
    setState({ ...state, projects: updatedProjects });
  };

  if (checkingBypass) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
          <Brain className="h-6 w-6" />
          <span className="text-lg">Loading OddGuard...</span>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
          <Brain className="h-6 w-6" />
          <span className="text-lg">Loading OddGuard...</span>
        </div>
      </div>
    );
  }

  const pendingTasks = activeProject?.tasks.filter((t) => !t.completed) ?? [];
  const completedTasks = activeProject?.tasks.filter((t) => t.completed) ?? [];

  const deadlineMs = activeProject?.deadline
    ? new Date(activeProject.deadline).getTime() - now
    : null;

  const deadlineDisplay =
    deadlineMs !== null ? formatDeadlineRemaining(deadlineMs) : null;

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <img src={logoIcon} alt="OddGuard" className="w-7 h-7" />
            <h1 className="text-2xl font-bold tracking-tight text-primary">
              OddGuard
            </h1>
          </div>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            Auto-pilot Intercepted for
            <span className="font-mono text-sm text-foreground bg-secondary px-2 py-0.5 rounded">
              {targetDomain}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Friction Timer */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Timer className="h-4 w-4 text-primary" />
                Friction Timer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div
                  className={`text-5xl font-bold tabular-nums tracking-tight transition-colors duration-500 ${
                    bypassEnabled ? "text-primary" : "text-foreground"
                  }`}
                >
                  {timer !== null && timer > 0 ? `${timer}s` : "0s"}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {timer !== null && timer > 0
                    ? "Pondering life choices..."
                    : "Ready to proceed"}
                </p>
              </div>
              <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-1000 ease-linear rounded-full"
                  style={{
                    width: `${
                      state.defaultTimerDuration > 0
                        ? ((timer ?? 0) / state.defaultTimerDuration) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <Button
                className="w-full gap-2 h-11 text-base font-semibold transition-all duration-300"
                disabled={!bypassEnabled}
                onClick={handleBypass}
              >
                {bypassEnabled ? (
                  <>
                    <ChevronRight className="h-5 w-5" />
                    Bypass Shield & Proceed to {targetDomain}
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 animate-pulse" />
                    Pondering...
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Project & Goal */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-primary" />
                  Current Project
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddProject(true)}
                  className="h-7 gap-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddProject && (
                <Card className="border-primary/30 animate-scale-in -mx-2">
                  <CardContent className="p-3 space-y-2.5">
                    <Input
                      placeholder="Project name"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      placeholder="Main goal"
                      value={newProjectGoal}
                      onChange={(e) => setNewProjectGoal(e.target.value)}
                      className="h-8 text-sm"
                    />

                    <Input
                      ref={inputRef}
                      type="datetime-local"
                      value={newProjectDeadline}
                      onChange={(e) => setNewProjectDeadline(e.target.value)}
                      className="h-9 text-sm cursor-pointer                    [&::-webkit-calendar-picker-indicator]:hidden
                   [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      onClick={() => inputRef.current?.showPicker()}
                    />
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={addProject}
                        className="h-7 text-xs gap-1"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowAddProject(false);
                          setNewProjectName("");
                          setNewProjectGoal("");
                          setNewProjectDeadline("");
                        }}
                        className="h-7 text-xs gap-1"
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Select
                value={state.activeProjectId ?? undefined}
                onValueChange={setActiveProjectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {state.projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {activeProject ? (
                <>
                  {activeProject.goal && (
                    <div className="bg-secondary/50 rounded-lg p-4 border-l-4 border-primary">
                      <p className="text-sm text-muted-foreground mb-1">
                        Focus Goal
                      </p>
                      <p className="text-lg font-semibold leading-snug">
                        {activeProject.goal}
                      </p>
                    </div>
                  )}

                  {deadlineDisplay && (
                    <div
                      className={`rounded-lg p-4 border-l-4 transition-colors ${
                        deadlineDisplay.expired
                          ? "bg-destructive/10 border-destructive"
                          : "bg-success/10 border-success"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Flag
                          className={`h-4 w-4 ${
                            deadlineDisplay.expired
                              ? "text-destructive"
                              : "text-success"
                          }`}
                        />
                        <p className="text-sm text-muted-foreground">
                          {deadlineDisplay.expired ? "Overdue" : "Remaining"}
                        </p>
                      </div>
                      <p
                        className={`text-2xl font-bold tabular-nums tracking-tight ${
                          deadlineDisplay.expired
                            ? "text-destructive"
                            : "text-success"
                        }`}
                      >
                        {deadlineDisplay.text}
                      </p>
                    </div>
                  )}

                  {!activeProject.goal && !activeProject.deadline && (
                    <p className="text-sm text-muted-foreground italic">
                      Open the OddGuard popup to set a goal and deadline for
                      this project.
                    </p>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                  <Target className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm italic">
                    Select a project to see your focus goal
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Kanban */}
          <Card className="md:col-span-2 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ListTodo className="h-4 w-4 text-primary" />
                Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeProject ? (
                <>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a new task..."
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addTask()}
                      className="flex-1"
                    />
                    <Button onClick={addTask} className="gap-1.5">
                      <Plus className="h-4 w-4" />
                      Add Task
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Pending ({pendingTasks.length})
                      </h3>
                      <div className="space-y-1">
                        {pendingTasks.map((task) => (
                          <div
                            key={task.id}
                            className="group flex items-center gap-3 rounded-lg border border-border px-3 py-2 hover:border-primary/30 transition-all duration-200"
                          >
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => toggleTask(task.id)}
                            />
                            <span className="flex-1 text-sm">{task.text}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => deleteTask(task.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        {pendingTasks.length === 0 && (
                          <p className="text-xs text-muted-foreground italic py-3 text-center">
                            No pending tasks
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" />
                        Completed ({completedTasks.length})
                      </h3>
                      <div className="space-y-1">
                        {completedTasks.map((task) => (
                          <div
                            key={task.id}
                            className="group flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2 bg-secondary/20"
                          >
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => toggleTask(task.id)}
                            />
                            <span className="flex-1 text-sm text-muted-foreground line-through">
                              {task.text}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => deleteTask(task.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        {completedTasks.length === 0 && (
                          <p className="text-xs text-muted-foreground italic py-3 text-center">
                            No completed tasks
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <ListTodo className="h-12 w-12 mb-3 opacity-20" />
                  <p className="text-sm italic">
                    Select a project above to manage tasks
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
