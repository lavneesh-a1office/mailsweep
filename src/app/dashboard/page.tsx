
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import MailSweepDashboard from '@/components/dashboard/MailSweepDashboard';
import { MailSweepLogo } from '@/components/icons';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-background">
        <MailSweepLogo className="h-16 w-16 text-primary animate-pulse" />
        <h1 className="text-2xl font-bold font-headline mt-4">Loading...</h1>
      </div>
    );
  }

  if (!user) {
    // This will be shown briefly before redirecting
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-background">
            <MailSweepLogo className="h-16 w-16 text-primary" />
            <h1 className="text-2xl font-bold font-headline mt-4">Redirecting to login...</h1>
        </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <MailSweepDashboard />
    </main>
  );
}
