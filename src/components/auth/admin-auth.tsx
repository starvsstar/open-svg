"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Lock } from "lucide-react";

interface AdminAuthProps {
  onAuth: (isAuthenticated: boolean) => void;
}

export function AdminAuth({ onAuth }: AdminAuthProps) {
  const { toast } = useToast();
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        onAuth(true);
        // 存储管理员会话
        sessionStorage.setItem("isAdmin", "true");
      } else {
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description: "Invalid admin password",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to authenticate",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md p-6">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-center">Admin Authentication</h1>
          <p className="text-sm text-muted-foreground text-center">
            Please enter the admin password to access prompt settings
          </p>
          
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <Input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" className="w-full">
              Authenticate
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
} 