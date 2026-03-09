import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Edit2, Trash } from "lucide-react";

interface SVGListItemProps {
  svg: {
    id: string;
    title: string;
    category: string;
    status: 'draft' | 'published';
    usage_count: number;
    created_at: string;
  };
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function SVGListItem({ svg, isSelected, onSelect, onDelete }: SVGListItemProps) {
  return (
    <div
      className={cn(
        "group p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors",
        isSelected && "bg-accent"
      )}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium truncate">{svg.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">{svg.category}</span>
            <span className="text-xs px-1.5 rounded-full bg-primary/10 text-primary">
              {svg.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span>Used {svg.usage_count} times</span>
        <span>{new Date(svg.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
} 