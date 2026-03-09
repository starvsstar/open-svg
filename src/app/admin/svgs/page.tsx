"use client";

import { useState, useEffect } from "react";
import { SVGListItem } from "@/components/admin/svgs/svg-list-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Plus, Search, Copy, Trash2, Save, Download, Maximize2, Wand2 } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { CodeEditor } from "@/components/svg/editor/CodeEditor";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { SVGPreviewModal } from "@/components/svg-preview-modal";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// 临时类型定义，后续可以移到单独的类型文件中
type OfficialSVG = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'draft' | 'published';
  usage_count: number;
  created_at: string;
  updated_at: string;
  svg_content: string;
};

type ViewMode = 'code' | 'preview' | 'split';

export default function AdminSvgsPage() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSVG, setSelectedSVG] = useState<OfficialSVG | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [svgCode, setSvgCode] = useState<string>(`<svg width="100" height="100">
  <!-- SVG code here -->
</svg>`);
  const [svgName, setSvgName] = useState<string>("");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isPublic, setIsPublic] = useState(true);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [svgs, setSvgs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/login");
      return;
    }
    
    if (session.user.role !== "ADMIN") {
      router.push("/403");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  const handleNewSVG = () => {
    setSelectedSVG(null);
    setIsCreating(true);
    setSvgName("");
    setSvgCode(`<svg width="100" height="100">
  <!-- SVG code here -->
</svg>`);
  };

  const handleCodeChange = (newCode: string) => {
    setSvgCode(newCode);
    // 更新预览
    const blob = new Blob([newCode], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    if (previewSrc) {
      URL.revokeObjectURL(previewSrc);
    }
    setPreviewSrc(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(svgCode);
      toast({
        description: "Copied to clipboard",
        className: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        description: "Failed to copy",
      });
    }
  };

  const handleClear = () => {
    setSvgCode(`<svg width="100" height="100">
  <!-- SVG code here -->
</svg>`);
    setSvgName("");
    toast({
      description: "Editor cleared",
      className: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    });
  };

  const handleSave = async () => {
    if (!svgName.trim()) {
      toast({
        variant: "destructive",
        description: "Please enter a name for your SVG",
      });
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(
        selectedSVG ? `/api/admin-svg/${selectedSVG.id}` : "/api/admin-svg",
        {
          method: selectedSVG ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: svgName,
            svg_content: svgCode,
            is_public: isPublic,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save SVG");
      }

      toast({
        description: `SVG ${selectedSVG ? 'updated' : 'saved'} successfully`,
        className: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "Failed to save SVG",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob([svgCode], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${svgName || 'untitled'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadSVGs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin-svg');
      if (!response.ok) throw new Error('Failed to load SVGs');
      const data = await response.json();
      setSvgs(data || []);
    } catch (error) {
      console.error('Load error:', error);
      toast({
        variant: "destructive",
        description: "Failed to load SVGs",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSVGs();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin-svg/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to delete SVG');
      }

      toast({
        description: "SVG deleted successfully",
        className: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      });

      // 重新加载列表
      loadSVGs();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        variant: "destructive",
        description: error instanceof Error ? error.message : "Failed to delete SVG",
      });
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* 左侧 Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold">Official SVGs</h2>
          </div>
          
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search SVGs..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="icons">Icons</SelectItem>
                <SelectItem value="illustrations">Illustrations</SelectItem>
                <SelectItem value="backgrounds">Backgrounds</SelectItem>
                <SelectItem value="patterns">Patterns</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : svgs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No SVGs found
              </div>
            ) : (
              svgs
                .filter(svg => 
                  selectedCategory === "all" || svg.category === selectedCategory
                )
                .filter(svg => 
                  svg.title.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(svg => (
                  <SVGListItem
                    key={svg.id}
                    svg={svg}
                    isSelected={selectedSVG?.id === svg.id}
                    onSelect={() => {
                      setSelectedSVG(svg);
                      setIsCreating(false);
                      setSvgName(svg.title);
                      setSvgCode(svg.svg_content);
                      // 更新预览
                      const blob = new Blob([svg.svg_content], { type: 'image/svg+xml' });
                      const url = URL.createObjectURL(blob);
                      if (previewSrc) {
                        URL.revokeObjectURL(previewSrc);
                      }
                      setPreviewSrc(url);
                    }}
                    onDelete={() => handleDelete(svg.id)}
                  />
                ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* 右侧内容区 */}
      <div className="flex-1 flex flex-col">
        <AdminHeader onNewSVG={handleNewSVG} />
        <main className="flex-1">
          {selectedSVG || isCreating ? (
            <div className="w-full h-full flex flex-col">
              {/* 工具栏 */}
              <div className="h-14 border-b flex items-center justify-between px-4">
                <div className="flex items-center space-x-4 flex-1">
                  <Input
                    placeholder="SVG name"
                    value={svgName}
                    onChange={(e) => setSvgName(e.target.value)}
                    className="max-w-[300px]"
                  />
                  <RadioGroup
                    value={isPublic ? 'public' : 'private'}
                    onValueChange={(value) => setIsPublic(value === 'public')}
                    className="flex items-center space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="private" id="private" />
                      <Label htmlFor="private">Personal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="public" id="public" />
                      <Label htmlFor="public">Public</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClear}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPreviewModalOpen(true)}
                  >
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </div>

              {/* 编辑器和预览区域 */}
              <div className="flex-1 flex">
                <div className={viewMode === 'preview' ? 'hidden' : 'flex-1'}>
                  <CodeEditor value={svgCode} onChange={handleCodeChange} />
                </div>
                {viewMode !== 'code' && (
                  <div className={`${viewMode === 'preview' ? 'w-full' : 'w-1/2'} border-l`}>
                    <div className="h-full flex items-center justify-center p-4">
                      {previewSrc ? (
                        <img
                          src={previewSrc}
                          alt="SVG Preview"
                          className="max-w-full max-h-full"
                        />
                      ) : (
                        <div className="text-muted-foreground">SVG Preview</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select an SVG to edit
            </div>
          )}
        </main>
      </div>

      {/* 预览态框 */}
      <SVGPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        svg={{
          title: svgName || 'Untitled',
          svg_content: svgCode
        }}
      />
    </div>
  );
} 