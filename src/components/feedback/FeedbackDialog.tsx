"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MailIcon, SendIcon, Sparkles, CheckCircle2 } from "lucide-react";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    title: "",
    description: "",
    email: "",
  });

  // 添加 useEffect 来监听 session 变化
  useEffect(() => {
    if (session?.user?.email) {
      setFormData(prev => ({
        ...prev,
        email: session.user.email || ""
      }));
    }
  }, [session]);

  // 添加表单验证状态
  const [errors, setErrors] = useState({
    type: "",
    title: "",
    description: "",
    email: "",
  });

  // 验证表单
  const validateForm = () => {
    const newErrors = {
      type: "",
      title: "",
      description: "",
      email: "",
    };

    if (!formData.type) {
      newErrors.type = "Please select a feedback type";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Please enter a subject";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Please enter a description";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== "");
  };

  // 检查表单是否可以提交
  const isFormValid = 
    formData.type !== "" && 
    formData.title.trim() !== "" && 
    formData.description.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      toast.success("Thank you for your feedback!");
      setIsSubmitted(true);
      
      // 5秒后自动关闭对话框
      setTimeout(() => {
        onOpenChange(false);
        setIsSubmitted(false);
        setFormData({
          type: "suggestion",
          title: "",
          description: "",
          email: session?.user?.email || "",
        });
      }, 5000);

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  // 提交成功后的界面
  if (isSubmitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-gradient-to-b from-background to-background/95 backdrop-blur-xl">
          <div className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-6">
              We appreciate your feedback and will review it carefully.
            </p>
            <p className="text-sm text-muted-foreground">
              This window will close automatically in a few seconds...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 原有的表单界面
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-gradient-to-b from-background to-background/95 backdrop-blur-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Contact Us</DialogTitle>
        </DialogHeader>
        
        <div className="relative h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
          <div className="absolute inset-0 bg-grid-white/15 [mask-image:linear-gradient(0deg,white,transparent)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="relative p-6 flex items-end h-full">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                Contact Us <Sparkles className="h-5 w-5" />
              </h2>
              <p className="text-white/80 mt-1">
                We value your feedback to help us improve our product.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 pt-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border/50 mb-6">
            <div className="shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <MailIcon className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Our Email:</p>
              <p className="text-sm font-medium truncate">
                chatfastar@gmail.com
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="type" className="text-sm font-medium">
                Feedback Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => {
                  setFormData({ ...formData, type: value });
                  setErrors({ ...errors, type: "" });
                }}
                required
              >
                <SelectTrigger className={`h-12 ${errors.type ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select feedback type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suggestion">Feature Suggestion</SelectItem>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="title" className="text-sm font-medium">
                Subject <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  setErrors({ ...errors, title: "" });
                }}
                placeholder="Brief description of your feedback"
                className={`h-12 ${errors.title ? 'border-red-500' : ''}`}
                required
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  setErrors({ ...errors, description: "" });
                }}
                placeholder="Please describe your suggestion or issue in detail..."
                className={`min-h-[120px] resize-none ${errors.description ? 'border-red-500' : ''}`}
                required
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-medium">
                Your Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                className="h-12 bg-muted/50"
                readOnly
                placeholder={session ? "Loading..." : "Please sign in"}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="h-12 px-6"
                onClick={() => {
                  onOpenChange(false);
                  setFormData({
                    type: "",
                    title: "",
                    description: "",
                    email: session?.user?.email || "",
                  });
                  setErrors({
                    type: "",
                    title: "",
                    description: "",
                    email: "",
                  });
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={loading || !isFormValid}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  <>
                    Submit Feedback
                    <SendIcon className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 