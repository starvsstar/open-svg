'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { defaultPrompts, PromptConfig } from "@/config/prompts";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { AdminAuth } from "@/components/auth/admin-auth";

export default function SettingsPage() {
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [prompts, setPrompts] = useState<PromptConfig>(defaultPrompts);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const adminSession = sessionStorage.getItem("isAdmin");
    if (adminSession === "true") {
      setIsAdmin(true);
    }
    
    const savedPrompts = localStorage.getItem('chatPrompts');
    if (savedPrompts) {
      setPrompts(JSON.parse(savedPrompts));
    }
  }, []);

  if (!isAdmin) {
    return <AdminAuth onAuth={setIsAdmin} />;
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('chatPrompts', JSON.stringify(prompts));
      toast({
        title: "Settings saved",
        description: "Your prompt settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPrompts(defaultPrompts);
    localStorage.removeItem('chatPrompts');
    toast({
      title: "Settings reset",
      description: "Prompt settings have been reset to defaults.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Prompt Settings</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              size="sm"
            >
              Reset to Default
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
            >
              {isSaving ? (
                "Saving..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-4">
        <div className="grid grid-cols-2 gap-6 h-[calc(100vh-4rem)]">
          <Card className="p-4 flex flex-col h-full">
            <div className="mb-2">
              <h2 className="text-lg font-semibold">System Prompt</h2>
              <p className="text-sm text-muted-foreground mt-1">
                This prompt controls how the AI assistant analyzes and responds to user inputs.
              </p>
            </div>
            <Textarea
              value={prompts.systemPrompt}
              onChange={(e) => setPrompts(prev => ({
                ...prev,
                systemPrompt: e.target.value
              }))}
              className="flex-1 min-h-0 font-mono text-sm resize-none p-4"
            />
          </Card>

          <Card className="p-4 flex flex-col h-full">
            <div className="mb-2">
              <h2 className="text-lg font-semibold">SVG Generation Prompt</h2>
              <p className="text-sm text-muted-foreground mt-1">
                This prompt defines the AI&apos;s capabilities and guidelines for generating SVG graphics.
              </p>
            </div>
            <Textarea
              value={prompts.svgPrompt}
              onChange={(e) => setPrompts(prev => ({
                ...prev,
                svgPrompt: e.target.value
              }))}
              className="flex-1 min-h-0 font-mono text-sm resize-none p-4"
            />
          </Card>
        </div>
      </div>
    </div>
  );
} 