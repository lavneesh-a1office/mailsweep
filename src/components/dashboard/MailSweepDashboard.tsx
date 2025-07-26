
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { CategorizeEmailsInput, CategorizeEmailsOutput } from '@/ai/flows/categorize-emails';
import { categorizeEmails } from '@/ai/flows/categorize-emails';
import { fetchEmails } from '@/ai/flows/fetch-emails';
import { deleteEmails } from '@/ai/flows/delete-emails';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { MailSweepLogo } from '@/components/icons';
import type { Email } from '@/lib/types';
import CategoryList from './CategoryList';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useCategorizedEmails } from '@/hooks/useCategorizedEmails';
import SummaryStats from './SummaryStats';


export type Category = CategorizeEmailsOutput['categories'][number];
export interface CategorizedEmail extends Email {
  category: Category;
}

interface MailSweepDashboardProps {
  rescanTrigger: number;
  onRescanComplete: () => void;
}


export default function MailSweepDashboard({ rescanTrigger, onRescanComplete }: MailSweepDashboardProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const { categorizedEmails, setCategorizedEmails } = useCategorizedEmails();
  const [isLoading, setIsLoading] = useState(true);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<Record<Category, boolean>>({
    Promotions: true, Social: true, Updates: true, Forums: true, 
    Purchases: false, Travel: false, Other: false
  });
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isFetchingEmails, setIsFetchingEmails] = useState(false);
  const [filteredEmailCount, setFilteredEmailCount] = useState(0);

  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem('gmail_access_token');
      setCategorizedEmails([]);
      setEmails([]);
      toast({
        title: 'Logout Successful',
      });
      router.push('/');
    } catch (error) {
      console.error('Error during logout:', error);
      toast({
        title: 'Logout Failed',
        description: 'There was an error logging out. Please try again.',
        variant: 'destructive',
      });
    }
  }, [router, setCategorizedEmails, toast]);

  const filteredEmails = useMemo(() => {
    const selectedCategoryNames = Object.entries(selectedCategories)
      .filter(([, isSelected]) => isSelected)
      .map(([category]) => category);

    if (categorizedEmails.length === 0) {
      return [];
    }

    return categorizedEmails.filter(email => {
      if (!email || !email.category) return false;
      return selectedCategoryNames.includes(email.category);
    });
  }, [categorizedEmails, selectedCategories]);

  useEffect(() => {
    setFilteredEmailCount(filteredEmails.length);
  }, [filteredEmails]);

  
  const handleFetchEmails = useCallback(async (forceRescan = false) => {
    const user = auth.currentUser;
    if (!user) {
        toast({ title: 'Not authenticated', description: 'Please login to fetch emails.', variant: 'destructive' });
        router.push('/');
        return;
    }

    setIsFetchingEmails(true);
    setIsLoading(true);

    if (!forceRescan) {
        const userDocRef = doc(db, 'userScans', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.categorizedEmails && data.categorizedEmails.length > 0) {
                setCategorizedEmails(data.categorizedEmails.map((e: any) => ({...e, category: e.category || 'Other'})));
                toast({ title: 'Success', description: 'Loaded cached scan results.' });
                setIsFetchingEmails(false);
                setIsLoading(false);
                onRescanComplete();
                return;
            }
        }
    }

    try {
        const accessToken = sessionStorage.getItem('gmail_access_token');
        if (!accessToken) {
             toast({ title: 'Authentication Error', description: 'Access token not found. Please log in again to grant permission.', variant: 'destructive' });
             await handleLogout();
             return;
        }

        const { emails: fetchedEmails } = await fetchEmails({ accessToken });
        setEmails(fetchedEmails);
        if (fetchedEmails.length > 0) {
            toast({ title: 'Success', description: `Found ${fetchedEmails.length} emails to scan.` });
            await handleStartScan(fetchedEmails);
            
        } else {
            toast({ title: 'No Emails Found', description: `We couldn't find any emails in the last scan.` });
        }
        
    } catch (error) {
        console.error('Failed to fetch emails:', error);
        toast({ 
            title: 'Error Fetching Emails', 
            description: 'Could not retrieve emails. Your session might have expired. Please log in again.', 
            variant: 'destructive' 
        });
        await handleLogout();
    } finally {
        setIsFetchingEmails(false);
        setIsLoading(false);
        onRescanComplete();
    }
  }, [toast, router, handleLogout, setCategorizedEmails, onRescanComplete]);


  useEffect(() => {
    const isInitialLoad = categorizedEmails.length === 0;
    const user = auth.currentUser;

    if(user){
        if (isInitialLoad && rescanTrigger === 0) {
            handleFetchEmails(false);
        } else if (rescanTrigger > 0) {
            handleFetchEmails(true);
        } else {
            setIsLoading(false);
        }
    } else {
      if (router) {
        router.push('/');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rescanTrigger, auth.currentUser, router]);


  const handleStartScan = async (emailsToScan: Email[]) => {
    const user = auth.currentUser;
    if (!user || emailsToScan.length === 0) {
        toast({
            title: "No Emails to Scan",
            description: "We didn't find any emails in your inbox to scan.",
            variant: "default",
        });
        return;
    };
    setIsCategorizing(true);
    setProgress(0);

    const emailInput: CategorizeEmailsInput = { emails: emailsToScan.map(({ subject, sender, body }) => ({ subject, sender, body })) };

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => (prev < 90 ? prev + 10 : prev));
      }, 300);

      const result = await categorizeEmails(emailInput);
      clearInterval(progressInterval);
      setProgress(100);
      
      const categorized = emailsToScan.map((email, index) => ({
        ...email,
        category: result.categories[index] || 'Other',
      }));
      setCategorizedEmails(categorized);
      
      const userDocRef = doc(db, 'userScans', user.uid);
      await setDoc(userDocRef, { categorizedEmails: categorized, updatedAt: new Date() });

      toast({
          title: "Scan Complete!",
          description: `Successfully categorized ${categorized.length} emails and saved results.`,
      });

    } catch (error) {
      console.error('Categorization failed:', error);
      toast({
        title: "Categorization Failed",
        description: "There was an error categorizing your emails. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setIsCategorizing(false), 500);
    }
  };

  const categoryCounts = useMemo(() => {
    const initialCounts: Record<Category, number> = { 
        Promotions: 0, Social: 0, Updates: 0, Forums: 0, 
        Purchases: 0, Travel: 0, Other: 0 
    };
    if (categorizedEmails.length === 0) return initialCounts;
    
    return categorizedEmails.reduce((acc, email) => {
      if (email.category in acc) {
        acc[email.category]++;
      }
      return acc;
    }, initialCounts);
  }, [categorizedEmails]);

  const handleDelete = async () => {
    setIsConfirmationOpen(false);
    if (filteredEmails.length === 0 || !auth.currentUser) return;
    setIsDeleting(true);

    const accessToken = sessionStorage.getItem('gmail_access_token');
    if (!accessToken) {
        toast({ title: 'Authentication Error', description: 'Access token not found. Please log in again.', variant: 'destructive' });
        await handleLogout();
        setIsDeleting(false);
        return;
    }

    const emailIds = filteredEmails.map(e => e.id);

    try {
        await deleteEmails({ accessToken, emailIds });
        
        const deletedIds = new Set(emailIds);
        const remainingEmails = categorizedEmails.filter(email => !deletedIds.has(email.id));
        setCategorizedEmails(remainingEmails);

        const userDocRef = doc(db, 'userScans', auth.currentUser.uid);
        await setDoc(userDocRef, { categorizedEmails: remainingEmails, updatedAt: new Date() }, { merge: true });

        toast({
            title: "Success!",
            description: `${emailIds.length.toLocaleString()} emails have been moved to trash.`,
        });

    } catch (error) {
        console.error('Failed to delete emails:', error);
        toast({ 
            title: 'Error Deleting Emails', 
            description: 'Could not delete emails. Your session might have expired. Please log in again.', 
            variant: 'destructive' 
        });
        await handleLogout();
    } finally {
        setIsDeleting(false);
    }
  };
  
  const totalEmailsCategorized = categorizedEmails.length;

  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  if (totalEmailsCategorized === 0 && !isCategorizing && !isFetchingEmails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-background">
        <MailSweepLogo className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-3xl font-bold font-headline mb-2">Ready to clean your inbox?</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
            {`We'll scan for emails to categorize. Click below to start.`}
        </p>
        <Button size="lg" onClick={() => handleFetchEmails(true) } disabled={isFetchingEmails} className="bg-accent text-accent-foreground hover:bg-accent/90">
          {isFetchingEmails ? 'Scanning...' : 'Scan My Inbox'}
        </Button>
      </div>
    );
  }

  if (isCategorizing || isFetchingEmails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-background">
        <MailSweepLogo className="h-16 w-16 text-primary mb-4 animate-pulse" />
        <h1 className="text-3xl font-bold font-headline mb-2">{isFetchingEmails ? 'Fetching emails...' : 'Categorizing your emails...'}</h1>
        <p className="text-muted-foreground mb-6">Our AI is working its magic. This may take a moment.</p>
        <Progress value={isFetchingEmails ? undefined : progress} className="w-full max-w-md" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-8">
        <SummaryStats
            emailsScanned={totalEmailsCategorized}
            emailsToDelete={filteredEmailCount}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <CategoryList 
              categoryCounts={categoryCounts}
              selectedCategories={selectedCategories}
              onCategoryChange={setSelectedCategories}
            />
          </div>
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-lg bg-card">
              <CardHeader>
                <CardTitle>Bulk Deletion Summary</CardTitle>
                <CardDescription>Review the emails that will be deleted based on your selections.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-2xl font-bold text-primary">
                    <span>Emails to delete:</span>
                    <span>{filteredEmailCount.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This action will move emails to trash in your Gmail account. This can be undone in Gmail.
                  </p>
                  <Button 
                    size="lg" 
                    className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={filteredEmailCount === 0 || isDeleting}
                    onClick={() => setIsConfirmationOpen(true)}
                  >
                    <Trash2 className="mr-2 h-5 w-5" />
                    {isDeleting ? 'Deleting...' : `Delete ${filteredEmailCount.toLocaleString()} Emails`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <DeleteConfirmationDialog 
        isOpen={isConfirmationOpen}
        onOpenChange={setIsConfirmationOpen}
        onConfirm={handleDelete}
        emailCount={filteredEmailCount}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4 animate-pulse">
      <div className="space-y-8">
        <Skeleton className="h-24 w-full rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
