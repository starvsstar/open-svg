'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save, Eye, EyeOff, Shield } from "lucide-react";
import Link from "next/link";
import { useAuthGuard } from "@/hooks/use-auth-guard";

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
}

export default function SecurityPage() {
  const { toast } = useToast();
  const { session, isLoading, isAuthenticated } = useAuthGuard();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [form, setForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<Partial<PasswordForm>>({});

  // 密码强度检查
  const checkPasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('密码至少需要8个字符');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('需要包含大写字母');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('需要包含小写字母');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('需要包含数字');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('需要包含特殊字符');
    }

    return { score, feedback };
  };

  const passwordStrength = checkPasswordStrength(form.newPassword);

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Partial<PasswordForm> = {};

    if (!form.currentPassword) {
      newErrors.currentPassword = '请输入当前密码';
    }

    if (!form.newPassword) {
      newErrors.newPassword = '请输入新密码';
    } else if (passwordStrength.score < 3) {
      newErrors.newPassword = '密码强度不够，请参考提示';
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = '请确认新密码';
    } else if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    if (form.currentPassword === form.newPassword) {
      newErrors.newPassword = '新密码不能与当前密码相同';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/user/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      if (response.ok) {
        toast({
          title: '密码修改成功',
          description: '您的密码已成功更新',
        });
        
        // 清空表单
        setForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setErrors({});
      } else {
        const errorText = await response.text();
        toast({
          variant: 'destructive',
          title: '密码修改失败',
          description: errorText === 'Invalid current password' ? '当前密码不正确' : '修改密码时发生错误',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '网络错误',
        description: '请检查网络连接后重试',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 切换密码显示状态
  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // 处理输入变化
  const handleInputChange = (field: keyof PasswordForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 获取密码强度颜色
  const getStrengthColor = (score: number) => {
    if (score < 2) return 'bg-red-500';
    if (score < 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // 获取密码强度文本
  const getStrengthText = (score: number) => {
    if (score < 2) return '弱';
    if (score < 4) return '中等';
    return '强';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // useAuthGuard will handle redirect
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">安全设置</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">修改密码</h2>
              <p className="text-sm text-muted-foreground">
                为了保护您的账户安全，请定期更新密码。新密码应包含大小写字母、数字和特殊字符。
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 当前密码 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">当前密码</label>
                <div className="relative">
                  <Input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={form.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    placeholder="请输入当前密码"
                    className={errors.currentPassword ? 'border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => togglePasswordVisibility('current')}
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.currentPassword && (
                  <p className="text-sm text-red-500">{errors.currentPassword}</p>
                )}
              </div>

              {/* 新密码 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">新密码</label>
                <div className="relative">
                  <Input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={form.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    placeholder="请输入新密码"
                    className={errors.newPassword ? 'border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {/* 密码强度指示器 */}
                {form.newPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">密码强度:</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength.score < 2 ? 'text-red-500' :
                        passwordStrength.score < 4 ? 'text-yellow-500' : 'text-green-500'
                      }`}>
                        {getStrengthText(passwordStrength.score)}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded ${
                            level <= passwordStrength.score
                              ? getStrengthColor(passwordStrength.score)
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {passwordStrength.feedback.map((item, index) => (
                          <li key={index}>• {item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                
                {errors.newPassword && (
                  <p className="text-sm text-red-500">{errors.newPassword}</p>
                )}
              </div>

              {/* 确认新密码 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">确认新密码</label>
                <div className="relative">
                  <Input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="请再次输入新密码"
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>

              {/* 提交按钮 */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    "修改中..."
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      修改密码
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}