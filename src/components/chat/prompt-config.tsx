import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PromptConfig } from "@/config/prompts";

interface PromptConfigProps {
  prompts: PromptConfig;
  onUpdate: (newPrompts: Partial<PromptConfig>) => void;
}

export function PromptConfigPanel({ prompts, onUpdate }: PromptConfigProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (!isEditing) {
    return (
      <Button onClick={() => setIsEditing(true)}>
        Edit Prompts
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label>System Prompt</label>
        <Textarea
          value={prompts.systemPrompt}
          onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
        />
      </div>
      <div>
        <label>SVG Prompt</label>
        <Textarea
          value={prompts.svgPrompt}
          onChange={(e) => onUpdate({ svgPrompt: e.target.value })}
        />
      </div>
      <Button onClick={() => setIsEditing(false)}>
        Save
      </Button>
    </div>
  );
} 