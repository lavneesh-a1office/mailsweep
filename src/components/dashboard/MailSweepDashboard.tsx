
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { CategorizeEmailsInput, CategorizeEmailsOutput } from '@/ai/flows/categorize-emails';
import { categorizeEmails } from '@/ai/flows/categorize-emails';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { MailSweepLogo } from '@/components/icons';
import { getMockEmails } from '@/lib/mock-data';
import type { Email } from '@/lib/types';
import CategoryList from './CategoryList';
import FilterControls from './FilterControls';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export type Category = CategorizeEmailsOutput['categories'][number];
export interface CategorizedEmail extends Email {
  category: Category;
}

export default function MailSweepDashboard() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [categorizedEmailsList, setCategorizedEmailsList] = useState<CategorizedEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<Record<Category, boolean>>({
    Promotions: true, Social: true, Updates: true, Forums: true, 
    Purchases: false, Travel: false, Other: false
  });
  const [ageFilter, setAgeFilter] = useState('1y');
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Simulate fetching emails
    const fetchedEmails = getMockEmails();
    setEmails(fetchedEmails);
    setIsLoading(false);
  }, []);

  const handleStartScan = async () => {
    if (emails.length === 0) return;
    setIsCategorizing(true);
    setProgress(0);

    const emailInput: CategorizeEmailsInput = { emails: emails.map(({ subject, sender, body }) => ({ subject, sender, body })) };

    try {
      // Simulate progress for AI categorization
      const progressInterval = setInterval(() => {
        setProgress(prev => (prev < 90 ? prev + 10 : prev));
      }, 300);

      const result = await categorizeEmails(emailInput);
      clearInterval(progressInterval);
      setProgress(100);
      
      const categorized = emails.map((email, index) => ({
        ...email,
        category: result.categories[index],
      }));
      setCategorizedEmailsList(categorized);

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

  const filteredEmails = useMemo(() => {
    const now = new Date();
    
    let filterDate = new Date();
    if (ageFilter === '1y') {
      filterDate.setFullYear(now.getFullYear() - 1);
    } else if (ageFilter === '3y') {
      filterDate.setFullYear(now.getFullYear() - 3);
    } else if (ageFilter === 'all') {
      // A very old date to include all emails
      filterDate = new Date(0);
    }

    return categorizedEmailsList.filter(email => {
      const emailDate = new Date(email.date);
      const isCategorySelected = selectedCategories[email.category];
      const isOldEnough = emailDate < filterDate;
      return isCategorySelected && isOldEnough;
    });
  }, [categorizedEmailsList, selectedCategories, ageFilter]);
  
  const categoryCounts = useMemo(() => {
    return categorizedEmailsList.reduce((acc, email) => {
      acc[email.category] = (acc[email.category] || 0) + 1;
      return acc;
    }, {} as Record<Category, number>);
  }, [categorizedEmailsList]);

  const handleDelete = () => {
    // In a real app, this would call the Gmail API to delete `filteredEmails`
    console.log(`Deleting ${filteredEmails.length} emails...`);
    setIsConfirmationOpen(false);

    // Filter out the "deleted" emails from the main list
    const deletedIds = new Set(filteredEmails.map(e => e.id));
    const remainingEmails = categorizedEmailsList.filter(email => !deletedIds.has(email.id));
    setCategorizedEmailsList(remainingEmails);

    toast({
      title: "Success!",
      description: `${filteredEmails.length.toLocaleString()} emails have been deleted.`,
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
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
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (categorizedEmailsList.length === 0 && !isCategorizing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <MailSweepLogo className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-3xl font-bold font-headline mb-2">Ready to clean your inbox?</h1>
        <p className="text-muted-foreground mb-6 max-w-md">We found {emails.length.toLocaleString()} emails. Start the AI-powered scan to categorize them and find what to delete.</p>
        <Button size="lg" onClick={handleStartScan} className="bg-accent text-accent-foreground hover:bg-accent/90">
          Scan My Inbox
        </Button>
      </div>
    );
  }

  if (isCategorizing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <MailSweepLogo className="h-16 w-16 text-primary mb-4 animate-pulse" />
        <h1 className="text-3xl font-bold font-headline mb-2">Categorizing your emails...</h1>
        <p className="text-muted-foreground mb-6">Our AI is working its magic. This may take a moment.</p>
        <Progress value={progress} className="w-full max-w-md" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          <MailSweepLogo className="h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold text-foreground font-headline">MailSweep</h1>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground hidden sm:block">{auth.currentUser?.email}</p>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
          <Button variant="outline" onClick={handleStartScan}>Rescan</Button>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <CategoryList 
            categoryCounts={categoryCounts}
            selectedCategories={selectedCategories}
            onCategoryChange={setSelectedCategories}
          />
        </div>
        <div className="lg:col-span-2 space-y-8">
          <FilterControls ageFilter={ageFilter} onAgeFilterChange={setAgeFilter} />
          
          <Card className="shadow-lg bg-card">
            <CardHeader>
              <CardTitle>Bulk Deletion Summary</CardTitle>
              <CardDescription>Review the emails that will be deleted based on your selections.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-2xl font-bold text-primary">
                  <span>Emails to delete:</span>
                  <span>{filteredEmails.length.toLocaleString()}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  This action will permanently delete emails from your account. This cannot be undone.
                </p>
                <Button 
                  size="lg" 
                  className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={filteredEmails.length === 0}
                  onClick={() => setIsConfirmationOpen(true)}
                >
                  <Trash2 className="mr-2 h-5 w-5" />
                  Delete {filteredEmails.length.toLocaleString()} Emails
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <DeleteConfirmationDialog 
        isOpen={isConfirmationOpen}
        onOpenChange={setIsConfirmationOpen}
        onConfirm={handleDelete}
        emailCount={filteredEmails.length}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4 animate-pulse">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-8 w-48 rounded-md" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </header>
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
  );
}
