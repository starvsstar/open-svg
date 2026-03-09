"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Mail, ExternalLink, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// 定义反馈状态类型
type FeedbackStatus = "pending" | "in_progress" | "completed" | "rejected";

// 定义反馈类型
interface Feedback {
  id: string;
  type: "suggestion" | "bug" | "other";
  title: string;
  description: string;
  email: string;
  status: FeedbackStatus;
  created_at: Date;
  user_id: string | null;
}

const fetchFeedbacks = async (status: string = 'all') => {
  try {
    console.log('Debug - Fetching feedbacks with status:', status);
    
    const response = await fetch(`/api/feedback${status !== 'all' ? `?status=${status}` : ''}`);
    console.log('Debug - Response status:', response.status);
    
    const data = await response.json();
    console.log('Debug - Response data:', data);
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch feedbacks');
    }
    
    return data;
  } catch (error) {
    console.error('Debug - Fetch error:', error);
    throw error;
  }
};

export default function FeedbackManagement() {
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "all">("all");
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  // 状态徽章的样式映射
  const statusConfig = {
    pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20" },
    in_progress: { label: "In Progress", color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" },
    completed: { label: "Completed", color: "bg-green-500/10 text-green-500 hover:bg-green-500/20" },
    rejected: { label: "Rejected", color: "bg-red-500/10 text-red-500 hover:bg-red-500/20" },
  };

  // 类型徽章的样式映射
  const typeConfig = {
    suggestion: { label: "Suggestion", color: "bg-purple-500/10 text-purple-500" },
    bug: { label: "Bug", color: "bg-red-500/10 text-red-500" },
    other: { label: "Other", color: "bg-gray-500/10 text-gray-500" },
  };

  // 状态图标映射
  const statusIcon = {
    pending: <Clock className="w-4 h-4" />,
    in_progress: <AlertCircle className="w-4 h-4" />,
    completed: <CheckCircle className="w-4 h-4" />,
    rejected: <XCircle className="w-4 h-4" />,
  };

  // 添加数据获取逻辑
  useEffect(() => {
    const loadFeedbacks = async () => {
      console.log('Debug - Loading feedbacks with filter:', statusFilter);
      setLoading(true);
      try {
        const data = await fetchFeedbacks(statusFilter);
        console.log('Debug - Loaded feedbacks:', data);
        setFeedbacks(data);
      } catch (error) {
        console.error('Debug - Load error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load feedbacks');
        setFeedbacks([]);
      } finally {
        setLoading(false);
      }
    };

    loadFeedbacks();
  }, [statusFilter]);

  // 添加更新状态的处理函数
  const handleStatusUpdate = async (feedbackId: string, newStatus: FeedbackStatus) => {
    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // 更新本地状态
      setFeedbacks(feedbacks.map(feedback => 
        feedback.id === feedbackId 
          ? { ...feedback, status: newStatus }
          : feedback
      ));

      toast.success('Status updated successfully');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Feedback Management</h1>
          <div className="flex items-center gap-4">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as FeedbackStatus | "all")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : feedbacks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No feedback found
                  </TableCell>
                </TableRow>
              ) : (
                feedbacks.map((feedback) => (
                  <TableRow key={feedback.id}>
                    <TableCell>
                      <Badge className={typeConfig[feedback.type].color}>
                        {typeConfig[feedback.type].label}
                      </Badge>
                    </TableCell>
                    <TableCell>{feedback.title}</TableCell>
                    <TableCell>
                      <Badge className={statusConfig[feedback.status].color}>
                        <span className="flex items-center gap-1">
                          {statusIcon[feedback.status]}
                          {statusConfig[feedback.status].label}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{feedback.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(feedback.created_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFeedback(feedback)}
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="sr-only">View details</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 反馈详情对话框 */}
      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
            <DialogDescription>
              Review and manage feedback submission
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedFeedback && (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold mb-1">Status</h3>
                    <Select
                      value={selectedFeedback.status}
                      onValueChange={(value) => {
                        if (selectedFeedback) {
                          handleStatusUpdate(selectedFeedback.id, value as FeedbackStatus);
                          setSelectedFeedback({ ...selectedFeedback, status: value as FeedbackStatus });
                        }
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Submitted on {format(new Date(), "MMM dd, yyyy HH:mm")}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Title</h3>
                  <p className="text-muted-foreground">
                    Improve SVG Editor Interface
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      The current SVG editor could use some improvements...
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Contact Information</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>user@example.com</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
} 