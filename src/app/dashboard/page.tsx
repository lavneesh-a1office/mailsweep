
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import MailSweepDashboard from '@/components/dashboard/MailSweepDashboard';
import { MailSweepLogo } from '@/components/icons';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LogOut, RotateCw, Scan, Trash2, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCategorizedEmails } from '@/hooks/useCategorizedEmails';
import Link from 'next/link';

export default function DashboardLayout() {
  const router = useRouter();
  const { toast } = useToast();
  const { setCategorizedEmails } = useCategorizedEmails();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRescanning, setIsRescanning] = useState(false);
  const [rescanTrigger, setRescanTrigger] = useState(0);

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem('gmail_access_token');
      setCategorizedEmails([]);
      toast({ title: 'Logout Successful' });
      router.push('/');
    } catch (error) {
      console.error('Error during logout:', error);
      toast({
        title: 'Logout Failed',
        description: 'There was an error logging out.',
        variant: 'destructive',
      });
    }
  };

  const handleRescan = () => {
    setIsRescanning(true);
    setRescanTrigger(prev => prev + 1);
  };
  
  const handleClearCacheAndRescan = async () => {
    if (!user) return;
    setIsRescanning(true);
    try {
        const userDocRef = doc(db, 'userScans', user.uid);
        await deleteDoc(userDocRef);
        setCategorizedEmails([]);
        toast({
            title: 'Cache Cleared',
            description: 'Starting a fresh scan of your inbox.',
        });
        setRescanTrigger(prev => prev + 1);
    } catch (error) {
        console.error('Failed to clear cache:', error);
        toast({
            title: 'Error',
            description: 'Could not clear cache. Please try again.',
            variant: 'destructive',
        });
        setIsRescanning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-background">
        <MailSweepLogo className="h-16 w-16 text-primary animate-pulse" />
        <h1 className="text-2xl font-bold font-headline mt-4">Loading...</h1>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting is handled in the effect
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas" variant="inset">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <MailSweepLogo className="h-8 w-8 text-primary" />
            <span className="text-lg font-semibold font-headline">MailSweep</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Dashboard" isActive>
                <Scan />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={handleClearCacheAndRescan} disabled={isRescanning} tooltip="Clear Cache & Rescan">
                    <Trash2 />
                    <span>Clear Cache</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                        <LogOut />
                        <span>Logout</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground hidden sm:block">{user.email}</p>
                <Button variant="outline" onClick={handleRescan} disabled={isRescanning}>
                    <RotateCw className={`mr-2 h-4 w-4 ${isRescanning ? 'animate-spin' : ''}`} />
                    {isRescanning ? 'Rescanning...' : 'Rescan'}
                </Button>
            </div>
        </header>
        <div className="flex flex-col min-h-[calc(100vh-65px)]">
          <main className="flex-grow">
            <MailSweepDashboard 
              rescanTrigger={rescanTrigger}
              onRescanComplete={() => setIsRescanning(false)}
            />
          </main>
          <footer className="text-center p-4 text-sm text-muted-foreground border-t">
            <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
                <span>© {new Date().getFullYear()} MailSweep. All rights reserved.</span>
                <Link href="https://blog.a1apps.co/privacy-policy-a1apps/" target="_blank" rel="noopener noreferrer" className="hover:underline">
                    Privacy Policy
                </Link>
            </div>
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
