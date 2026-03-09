"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sparkles, Bell, Plus, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { UserNav } from "@/components/layout/UserNav";

interface Prompt {
  id: string;
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

interface HeaderProps {
  onNewSVG?: () => void;
}

export function Header({ onNewSVG }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [currentPromptName, setCurrentPromptName] = useState("");

  const loadPrompts = async () => {
    try {
      const res = await fetch('/api/prompts');
      if (!res.ok) throw new Error('Failed to fetch prompts');
      const data = await res.json();
      const formattedPrompts = data.map((prompt: any) => ({
        ...prompt,
        created_at: new Date(prompt.created_at),
        updated_at: new Date(prompt.updated_at),
      }));
      setPrompts(formattedPrompts);
    } catch (error) {
      toast.error('Failed to load prompts');
    }
  };

  useEffect(() => {
    loadPrompts();
  }, []);

  const handleSave = async () => {
    if (!currentPromptName.trim()) {
      toast.error("Please enter a prompt name");
      return;
    }

    try {
      if (selectedPrompt) {
        const res = await fetch(`/api/prompts/${selectedPrompt.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: currentPromptName,
            content: currentPrompt,
          }),
        });
        if (!res.ok) throw new Error('Failed to update prompt');
      } else {
        const res = await fetch('/api/prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: currentPromptName,
            content: currentPrompt,
          }),
        });
        if (!res.ok) throw new Error('Failed to create prompt');
      }

      await loadPrompts();
      setCurrentPrompt("");
      setCurrentPromptName("");
      setSelectedPrompt(null);
      toast.success(selectedPrompt ? 'Prompt updated' : 'Prompt saved');
    } catch (error) {
      toast.error('Failed to save prompt');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/prompts/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete prompt');

      await loadPrompts();
      if (selectedPrompt?.id === id) {
        setSelectedPrompt(null);
        setCurrentPrompt("");
        setCurrentPromptName("");
      }
      toast.success('Prompt deleted');
    } catch (error) {
      toast.error('Failed to delete prompt');
    }
  };

  const handleEdit = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setCurrentPrompt(prompt.content);
    setCurrentPromptName(prompt.title);
  };

  const handleNew = () => {
    setSelectedPrompt(null);
    setCurrentPrompt("");
    setCurrentPromptName("");
  };

  const handleRename = async (prompt: Prompt, newName: string) => {
    try {
      const res = await fetch(`/api/prompts/${prompt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newName }),
      });
      if (!res.ok) throw new Error('Failed to rename prompt');

      await loadPrompts();
      toast.success('Prompt renamed');
    } catch (error) {
      toast.error('Failed to rename prompt');
    }
  };

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/studio"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          New SVG
        </Link>
    
        <Dialog open={open} onOpenChange={setOpen}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="hover:bg-accent"
            onClick={() => setOpen(true)}
          >
            <Sparkles className="h-5 w-5" />
          </Button>
          <DialogContent className="max-w-[70vw] w-[900px]">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle>Manage Prompts</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-[300px_1fr] gap-6 pt-4">
              {/* 左侧 Prompts 列表 */}
              <div className="space-y-4 border-r pr-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="font-semibold">Saved Prompts</h3>
                    <p className="text-sm text-muted-foreground">
                      {prompts.length} prompts saved
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleNew}
                    className="h-8"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New
                  </Button>
                </div>
                <Separator />
                <ScrollArea className="h-[500px] pr-4 -mr-4">
                  <div className="space-y-2">
                    {prompts.map((prompt) => (
                      <div
                        key={prompt.id}
                        className={cn(
                          "group p-3 rounded-lg border transition-colors cursor-pointer",
                          selectedPrompt?.id === prompt.id 
                            ? "bg-accent border-accent-foreground/20" 
                            : "border-border hover:bg-muted/50"
                        )}
                        onClick={() => handleEdit(prompt)}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-medium">{prompt.title}</h4>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newName = window.prompt("Rename prompt", prompt.title);
                                if (newName) handleRename(prompt, newName);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(prompt.id);
                              }}
                            >
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Last updated: {prompt.updated_at.toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* 右侧编辑区域 */}
              <div className="space-y-4">
                <h3 className="font-semibold">
                  {selectedPrompt ? 'Edit Prompt' : 'Create New Prompt'}
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prompt-name">Prompt Name</Label>
                    <Input
                      id="prompt-name"
                      value={currentPromptName}
                      onChange={(e) => setCurrentPromptName(e.target.value)}
                      placeholder="Give your prompt a name..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prompt-content">Prompt Content</Label>
                    <Textarea
                      id="prompt-content"
                      value={currentPrompt}
                      onChange={(e) => setCurrentPrompt(e.target.value)}
                      placeholder="Describe the SVG you want to create..."
                      className="min-h-[400px] resize-none text-base"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedPrompt(null);
                      setCurrentPrompt("");
                      setCurrentPromptName("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!currentPrompt.trim() || !currentPromptName.trim()}
                  >
                    {selectedPrompt ? 'Update' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex items-center gap-6">
        <ThemeToggle />
        {/* <button className="relative p-2 hover:bg-accent rounded-full">
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button> */}
        <UserNav />
      </div>
    </header>
  );
} 