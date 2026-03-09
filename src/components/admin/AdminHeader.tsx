import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function AdminHeader({ 
  onNewSVG 
}: { 
  onNewSVG: () => void 
}) {
  return (
    <header className="h-14 border-b flex items-center justify-between px-4">
      <Button 
        size="sm"
        onClick={onNewSVG}
      >
        <Plus className="h-4 w-4 mr-2" />
        New SVG
      </Button>
    </header>
  );
} 