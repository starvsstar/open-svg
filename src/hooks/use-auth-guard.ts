import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useAuthGuard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      toast.error('Please sign in to continue');
      router.push('/login');
    }
  }, [session, status, router]);

  return {
    session,
    isLoading: status === 'loading',
    isAuthenticated: !!session
  };
} 