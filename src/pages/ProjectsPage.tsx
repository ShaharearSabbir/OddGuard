import React, { useRef, useState } from "react";
import { Project } from "../types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { Card, CardContent } from "../components/ui/card";

import { generateId } from "../lib/utils";
import { Plus, Trash2, FolderKanban, Check, X } from "lucide-react";

interface ProjectsPageProps {
  projects: Project[];
  activeProjectId: string | null;
  onSetActive: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (p: Project) => void;
}

export function ProjectsPage({
  projects,
  activeProjectId,
  onSetActive,
  onDelete,
  onAdd,
}: ProjectsPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const add = () => {
    if (!name.trim()) return;
    onAdd({
      id: generateId(),
      name: name.trim(),
      goal: goal.trim(),
      deadline: deadline || null,
      tasks: [],
    });
    setName("");
    setGoal("");
    setDeadline("");
    setShowForm(false);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">Projects</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(true)}
          className="h-8 gap-1.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Project
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30 animate-scale-in">
          <CardContent className="p-3 space-y-2.5">
            <Input
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-sm"
            />
            <Input
              placeholder="Main goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="h-8 text-sm"
            />

            <Input
              ref={inputRef}
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="h-9 text-sm cursor-pointer                    [&::-webkit-calendar-picker-indicator]:hidden
                   [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              onClick={() => inputRef.current?.showPicker()}
            />
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={add} className="h-7 text-xs gap-1">
                <Check className="h-3.5 w-3.5" />
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
                className="h-7 text-xs gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
        {projects.map((p) => (
          <div
            key={p.id}
            className={`group flex items-start gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-all duration-200 hover:border-primary/30 ${
              activeProjectId === p.id
                ? "border-primary/50 bg-primary/5"
                : "border-border"
            }`}
            onClick={() => onSetActive(p.id)}
          >
            <Checkbox
              checked={activeProjectId === p.id}
              className="mt-0.5"
              onCheckedChange={() => onSetActive(p.id)}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-sm font-medium truncate ${
                    activeProjectId === p.id
                      ? "text-primary"
                      : "text-foreground"
                  }`}
                >
                  {p.name}
                </span>
                {activeProjectId === p.id && (
                  <span className="text-[10px] font-semibold uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded animate-fade-in">
                    Active
                  </span>
                )}
              </div>
              {p.goal && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {p.goal}
                </p>
              )}
              {p.deadline && (
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                  Due:{" "}
                  {new Date(p.deadline).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(p.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-8">
            <FolderKanban className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No projects yet</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Create your first project
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
