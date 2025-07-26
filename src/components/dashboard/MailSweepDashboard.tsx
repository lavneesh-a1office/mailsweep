
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
import { Trash2, ScanSearch } from 'lucide-react';
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
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [filteredEmailCount, setFilteredEmailCount] = useState(0);

  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem('gmail_access_token');
      setCategorizedEmails([]);
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
  
  const handleFetchEmails = useCallback(async (options: { forceRescan?: boolean, pageToken?: string }) => {
    const { forceRescan = false, pageToken } = options;
    const user = auth.currentUser;
    if (!user) {
        toast({ title: 'Not authenticated', description: 'Please login to fetch emails.', variant: 'destructive' });
        router.push('/');
        return;
    }

    setIsFetchingEmails(true);
    if (!pageToken) {
      setIsLoading(true);
      if (forceRescan) {
        setCategorizedEmails([]);
        setNextPageToken(undefined);
      }
    }
    
    if (!forceRescan && !pageToken) {
        const userDocRef = doc(db, 'userScans', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.categorizedEmails && data.categorizedEmails.length > 0) {
                setCategorizedEmails(data.categorizedEmails.map((e: any) => ({...e, category: e.category || 'Other'})));
                setNextPageToken(data.nextPageToken);
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

        const { emails: fetchedEmails, nextPageToken: newNextPageToken } = await fetchEmails({ accessToken, pageToken });
        
        const currentEmails = pageToken ? categorizedEmails : [];
        setNextPageToken(newNextPageToken);

        if (fetchedEmails.length > 0) {
            toast({ title: 'Success', description: `Found ${fetchedEmails.length} emails to scan.` });
            await handleStartScan([...currentEmails, ...fetchedEmails], !!pageToken, newNextPageToken);
            
        } else {
            toast({ title: 'No More Emails', description: `We couldn't find any more emails to scan.` });
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
  }, [toast, router, handleLogout, setCategorizedEmails, onRescanComplete, categorizedEmails]);


  useEffect(() => {
    const isInitialLoad = categorizedEmails.length === 0;
    const user = auth.currentUser;

    if(user){
        if (isInitialLoad && rescanTrigger === 0) {
            handleFetchEmails({ forceRescan: false });
        } else if (rescanTrigger > 0) {
            handleFetchEmails({ forceRescan: true });
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


  const handleStartScan = async (emailsToScan: Email[], append: boolean, finalNextPageToken: string | undefined) => {
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
      
      const newCategorized = emailsToScan.map((email, index) => ({
        ...email,
        category: result.categories[index] || 'Other',
      }));

      setCategorizedEmails(newCategorized);
      
      const userDocRef = doc(db, 'userScans', user.uid);
      await setDoc(userDocRef, { categorizedEmails: newCategorized, updatedAt: new Date(), nextPageToken: finalNextPageToken });

      toast({
          title: "Scan Complete!",
          description: `Successfully categorized ${emailsToScan.length} emails.`,
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
        await setDoc(userDocRef, { categorizedEmails: remainingEmails, updatedAt: new Date(), nextPageToken }, { merge: true });

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
        <Button size="lg" onClick={() => handleFetchEmails({ forceRescan: true }) } disabled={isFetchingEmails} className="bg-accent text-accent-foreground hover:bg-accent/90">
          {isFetchingEmails ? 'Scanning...' : 'Scan My Inbox'}
        </Button>
      </div>
    );
  }

  if ((isCategorizing || isFetchingEmails) && categorizedEmails.length === 0) {
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-3 space-y-4">
            {nextPageToken && (
              <Card>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-grow">
                    <h3 className="font-semibold text-sm">Continue scanning your inbox</h3>
                    <p className="text-xs text-muted-foreground">We scan 500 at a time. Click to scan for more.</p>
                  </div>
                  <Button
                    size="sm"
                    className="flex-shrink-0"
                    onClick={() => handleFetchEmails({ pageToken: nextPageToken })}
                    disabled={isFetchingEmails || isCategorizing}
                  >
                    <ScanSearch className="mr-2 h-4 w-4" />
                    {isFetchingEmails || isCategorizing ? 'Scanning...' : 'Scan More'}
                  </Button>
                </CardContent>
              </Card>
            )}
            <CategoryList 
              categoryCounts={categoryCounts}
              selectedCategories={selectedCategories}
              onCategoryChange={setSelectedCategories}
            />
          </div>
          <div className="pb-24 md:pb-0 md:col-span-3">
             {/* Sticky footer for mobile, regular card for desktop */}
            <div className="fixed bottom-0 left-0 right-0 z-10 bg-background/95 p-4 backdrop-blur-sm border-t md:static md:bg-transparent md:p-0 md:border-none md:shadow-none">
                <Card className="md:shadow-lg md:bg-card">
                    <CardHeader className="hidden md:flex">
                        <CardTitle>Bulk Deletion Summary</CardTitle>
                        <CardDescription>Review the emails that will be deleted based on your selections.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 md:p-6">
                        <div className="flex md:flex-col items-center justify-between gap-4 md:space-y-4">
                            <div className="flex md:w-full justify-between items-center text-lg md:text-2xl font-bold text-primary">
                                <span className="md:hidden">To Delete:</span>
                                <span className="hidden md:inline">Emails to delete:</span>
                                <span>{filteredEmailCount.toLocaleString()}</span>
                            </div>
                            <Button
                                size="lg"
                                className="w-auto md:w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={filteredEmailCount === 0 || isDeleting}
                                onClick={() => setIsConfirmationOpen(true)}
                            >
                                <Trash2 className="mr-2 h-5 w-5" />
                                <span className="hidden sm:inline">{isDeleting ? 'Deleting...' : `Delete ${filteredEmailCount.toLocaleString()} Emails`}</span>
                                <span className="sm:hidden">{isDeleting ? '...' : 'Delete'}</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
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

