"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CameraIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";

export function UserNav() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [name, setName] = useState(session?.user?.name || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(session?.user?.avatar_url || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    // 实现个人资料更新逻辑
  };

  const handleChangePassword = async () => {
    // 表单验证
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "错误",
        description: "请填写所有密码字段"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "错误",
        description: "新密码和确认密码不一致"
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "错误",
        description: "新密码至少需要8个字符"
      });
      return;
    }

    if (currentPassword === newPassword) {
      toast({
        variant: "destructive",
        title: "错误",
        description: "新密码不能与当前密码相同"
      });
      return;
    }

    // 密码强度验证
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      toast({
        variant: "destructive",
        title: "密码强度不够",
        description: "新密码必须包含大写字母、小写字母、数字和特殊字符"
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/user/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (response.ok) {
        toast({
          title: "成功",
          description: "密码修改成功"
        });
        // 清空表单
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // 关闭弹窗
        setSettingsOpen(false);
      } else {
        const errorText = await response.text();
        if (errorText === 'Invalid current password') {
          toast({
            variant: "destructive",
            title: "错误",
            description: "当前密码不正确"
          });
        } else {
          toast({
            variant: "destructive",
            title: "错误",
            description: "密码修改失败，请重试"
          });
        }
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast({
        variant: "destructive",
        title: "网络错误",
        description: "请检查连接后重试"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut({ 
        redirect: false 
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "错误",
        description: "登出失败"
      });
    }
  };

  if (status === "loading") {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />;
  }

  if (!session) {
    return (
      <div className="flex items-center gap-4">
        <Link 
          href="/login?type=signin" 
          className="px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Login
        </Link>
        <Link 
          href="/login?type=signup" 
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative flex items-center gap-2 px-4">
            <span className="text-sm font-medium hidden md:inline-block">
              {session.user?.name}
            </span>
            <Avatar className="h-8 w-8">
              <AvatarImage src={session.user?.avatar_url || ""} alt={session.user?.name || ""} />
              <AvatarFallback>{session.user?.name?.[0]}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{session.user?.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {session.user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/my-svgs">My SVGs</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setFeedbackOpen(true)}>
              Contact Us
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 cursor-pointer"
            onClick={handleSignOut}
          >
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 设置弹窗 */}
      <Dialog 
        open={settingsOpen} 
        onOpenChange={(open) => {
          setSettingsOpen(open);
          
          if (!open) {
            setTimeout(() => {
              document.querySelectorAll('[data-radix-portal]').forEach(portal => {
                if (!portal.hasChildNodes()) {
                  portal.remove();
                }
              });
              document.body.style.pointerEvents = '';
              document.body.style.overflow = '';
            }, 300);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>账户设置</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="profile" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">个人资料</TabsTrigger>
              <TabsTrigger value="security">安全设置</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>个人资料</CardTitle>
                  <CardDescription>更新你的个人信息</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={avatarPreview} />
                        <AvatarFallback>{name?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <label 
                        htmlFor="avatar-upload" 
                        className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90"
                      >
                        <CameraIcon className="w-4 h-4" />
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">头像</h4>
                      <p className="text-sm text-muted-foreground">
                        支持 JPG, PNG, GIF 格式，最大 2MB
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">用户名</Label>
                    <Input 
                      id="name" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">邮箱</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={session?.user?.email || ''} 
                      disabled 
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleUpdateProfile}
                    disabled={loading || (!avatarFile && name === session?.user?.name)}
                  >
                    {loading ? "保存中..." : "保存更改"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>修改密码</CardTitle>
                  <CardDescription>确保你的账户安全</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">当前密码</Label>
                    <Input 
                      id="current-password" 
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">新密码</Label>
                    <Input 
                      id="new-password" 
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">确认新密码</Label>
                    <Input 
                      id="confirm-password" 
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleChangePassword}
                    disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                  >
                    {loading ? "更新中..." : "更新密码"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <FeedbackDialog 
        open={feedbackOpen} 
        onOpenChange={(open) => {
          setFeedbackOpen(open);
          
          if (!open) {
            setTimeout(() => {
              document.querySelectorAll('[data-radix-portal]').forEach(portal => {
                if (!portal.hasChildNodes()) {
                  portal.remove();
                }
              });
              document.body.style.pointerEvents = '';
              document.body.style.overflow = '';
            }, 300);
          }
        }}
      />
    </>
  );
}