"use client";

import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Wand2, User2, Send, Loader2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { defaultPrompts, PromptConfig } from "@/config/prompts";
import Link from "next/link";
import { CodeBlock } from "./code-block";

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  loading?: boolean;
};

interface AIChatProps {
  onApplyCode?: (code: string) => void;
}

export function AIChat({ onApplyCode }: AIChatProps) {
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [prompts, setPrompts] = useState<PromptConfig>(defaultPrompts);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I can help you create SVG graphics. Just describe what you want to create, and I'll generate it for you."
    }
  ]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current.parentElement?.parentElement;
      if (scrollArea) {
        scrollArea.scrollTo({
          top: scrollArea.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [messages]);

  useEffect(() => {
    const savedPrompts = localStorage.getItem('chatPrompts');
    if (savedPrompts) {
      const parsed = JSON.parse(savedPrompts);
      setPrompts(parsed);
      setMessages([
        {
          role: 'assistant',
          content: "Hi! I can help you create SVG graphics. Just describe what you want to create, and I'll generate it for you."
        }
      ]);
    }
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    const userInput = prompt;
    setPrompt('');

    setMessages(prev => [...prev, 
      { role: 'user', content: userInput },
      { role: 'assistant', content: '', loading: true }
    ]);

    requestAnimationFrame(scrollToBottom);

    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [
            { role: 'system', content: prompts.systemPrompt },
            ...messages,
            { role: 'user', content: userInput }
          ],
          prompts,
          sessionId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let accumulatedResponse = '';
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: '',
          loading: false
        };
        return newMessages;
      });

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        const text = decoder.decode(value);
        accumulatedResponse += text;

        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: accumulatedResponse
          };
          return newMessages;
        });

        requestAnimationFrame(scrollToBottom);
      }

    } catch (error) {
      setMessages(prev => prev.slice(0, -1));
      
      console.error("Chat error:", error);
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "Failed to get response",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  function debounce<T extends (...args: any[]) => void>(
    fn: T, 
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  const clearHistory = () => {
    if (sessionId) {
      fetch("/api/chat/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
      setMessages([{
        role: 'assistant',
        content: "Hi! I can help you create SVG graphics. Just describe what you want to create, and I'll generate it for you."
      }]);
    }
  };

  const updatePrompts = (newPrompts: Partial<PromptConfig>) => {
    setPrompts(prev => ({
      ...prev,
      ...newPrompts
    }));
  };

  const renderMessageContent = (content: string) => {
    const parts = content.split(/(```svg[\s\S]*?```|<\?xml[\s\S]*?<\/svg>)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```svg')) {
        const code = part.replace(/```svg\n?/, '').replace(/\n?```$/, '');
        return (
          <CodeBlock
            key={index}
            code={code}
            onApply={(code) => onApplyCode?.(code)}
          />
        );
      }
      else if (part.startsWith('<?xml') && part.includes('</svg>')) {
        return (
          <CodeBlock
            key={index}
            code={part}
            onApply={(code) => onApplyCode?.(code)}
          />
        );
      }
      return (
        <p key={index} className="whitespace-pre-wrap">
          {part}
        </p>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-8rem)]">
      <ScrollArea className="flex-1 px-6 py-4 overflow-y-auto">
        <div 
          ref={scrollAreaRef}
          className="space-y-4 max-w-3xl mx-auto"
        >
          {messages.map((message, index) => (
            <div key={index} className={cn(
              "flex gap-3",
              message.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}>
              {message.role === 'assistant' ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex-shrink-0 flex items-center justify-center">
                    <Wand2 className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1 max-w-[80%]">
                    {message.loading ? (
                      <div className="inline-block bg-gray-100 dark:bg-gray-800 rounded-2xl px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                        </div>
                      </div>
                    ) : (
                      <div className="inline-block bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2.5 text-sm w-full">
                        {renderMessageContent(message.content)}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center">
                    <User2 className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 max-w-[80%] flex justify-end">
                    <div className="inline-block bg-blue-500 text-white rounded-2xl px-4 py-2.5 text-sm">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t bg-background p-4">
        <div className="max-w-3xl mx-auto space-y-3">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerate();
            }}
            className="relative"
          >
            <Textarea
              placeholder="Type your message..."
              className="min-h-[56px] max-h-[200px] p-3 pr-12 resize-none bg-background border-muted rounded-xl focus-visible:ring-1 focus-visible:ring-blue-500/40 transition-all"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (prompt.trim()) {
                    handleGenerate();
                  }
                }
              }}
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className={cn(
                "absolute right-3 bottom-[10px] h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-900/20",
                isGenerating && "cursor-not-allowed opacity-50"
              )}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              ) : (
                <Send className="h-4 w-4 text-blue-500" />
              )}
            </Button>
          </form>

          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearHistory}
                className="h-8 text-xs font-medium border-muted-foreground/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all"
              >
                Clear chat
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 