import { Button } from "@/components/ui/button";
import { Copy, Code2, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface CodeBlockProps {
  code: string;
  onApply: (code: string) => void;
}

export function CodeBlock({ code, onApply }: CodeBlockProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        description: "Code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to copy code",
      });
    }
  };

  return (
    <div className="relative mt-2">
      <div className="absolute right-2 top-2 flex items-center gap-1 z-10">
        <Button
          variant="secondary"
          size="sm"
          className={cn(
            "h-7 px-2 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-500",
            copied && "bg-green-500/20 hover:bg-green-500/30 text-green-500"
          )}
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 mr-1" />
              Copy
            </>
          )}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="h-7 px-2 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-500"
          onClick={() => onApply(code)}
        >
          <Code2 className="h-3.5 w-3.5 mr-1" />
          Apply
        </Button>
      </div>
      <pre className={cn(
        "p-4 pt-12 bg-zinc-900 text-blue-50 rounded-lg",
        "text-sm font-mono",
        "whitespace-pre-wrap break-all",
        "max-w-full",
        "border border-blue-500/20"
      )}>
        <code className="block w-full">
          {code.split('\n').map((line, i) => (
            <div key={i} className="leading-6">
              {line}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
} 