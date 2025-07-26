
'use client';

import { useCategorizedEmails } from '@/hooks/useCategorizedEmails';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { CategorizedEmail } from '@/components/dashboard/MailSweepDashboard';
import EmailDetailDialog from './EmailDetailDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { deleteEmails } from '@/ai/flows/delete-emails';
import DeleteConfirmationDialog from '@/components/dashboard/DeleteConfirmationDialog';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';


export default function CategoryPreviewPage() {
  const { categorizedEmails, setCategorizedEmails } = useCategorizedEmails();
  const params = useParams();
  const router = useRouter();
  const category = params.category as string;
  const { toast } = useToast();

  const [selectedEmail, setSelectedEmail] = useState<CategorizedEmail | null>(null);
  const [selectedEmailIds, setSelectedEmailIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  const decodedCategory = useMemo(() => decodeURIComponent(category || ''), [category]);
  
  const filteredEmails = useMemo(() => {
    if (!decodedCategory) return [];
    return categorizedEmails.filter(email => email.category === decodedCategory);
  }, [categorizedEmails, decodedCategory]);

  const allSelected = useMemo(() => {
    return filteredEmails.length > 0 && selectedEmailIds.size === filteredEmails.length;
  }, [selectedEmailIds, filteredEmails]);


  const handleToggleSelection = (id: string) => {
    setSelectedEmailIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedEmailIds(new Set());
    } else {
      setSelectedEmailIds(new Set(filteredEmails.map(e => e.id)));
    }
  };

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
    }
  }, [router, setCategorizedEmails, toast]);

  const handleDelete = async () => {
    setIsConfirmationOpen(false);
    const user = auth.currentUser;
    if (selectedEmailIds.size === 0 || !user) return;
    setIsDeleting(true);

    const accessToken = sessionStorage.getItem('gmail_access_token');
    if (!accessToken) {
      toast({ title: 'Authentication Error', description: 'Access token not found. Please log in again.', variant: 'destructive' });
      await handleLogout();
      setIsDeleting(false);
      return;
    }

    const emailIdsToDelete = Array.from(selectedEmailIds);

    try {
      await deleteEmails({ accessToken, emailIds: emailIdsToDelete });

      const deletedIds = new Set(emailIdsToDelete);
      const remainingEmails = categorizedEmails.filter(email => !deletedIds.has(email.id));
      setCategorizedEmails(remainingEmails);

      const userDocRef = doc(db, 'userScans', user.uid);
      await setDoc(userDocRef, { categorizedEmails: remainingEmails, updatedAt: new Date() }, { merge: true });

      toast({
        title: "Success!",
        description: `${emailIdsToDelete.length.toLocaleString()} emails have been moved to trash.`,
      });
      setSelectedEmailIds(new Set());

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

  if (!decodedCategory) {
    return <div>Invalid category.</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="flex items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
            <Link href="/dashboard" passHref>
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-headline">Emails in "{decodedCategory}"</h1>
              <p className="text-muted-foreground">{filteredEmails.length.toLocaleString()} emails found</p>
            </div>
        </div>
      </header>
      
      {filteredEmails.length > 0 ? (
        <>
            <div className="flex items-center justify-between mb-4 p-2 rounded-md bg-muted/50">
                <div className="flex items-center gap-3">
                    <Checkbox
                        id="select-all"
                        checked={allSelected}
                        onCheckedChange={handleToggleSelectAll}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium">Select All</label>
                </div>
                <Button
                    variant="destructive"
                    size="sm"
                    disabled={selectedEmailIds.size === 0 || isDeleting}
                    onClick={() => setIsConfirmationOpen(true)}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeleting ? 'Deleting...' : `Delete (${selectedEmailIds.size})`}
                </Button>
            </div>
            <div className="space-y-2">
            {filteredEmails.map(email => (
                <div key={email.id} className="flex items-center gap-2">
                <Checkbox
                    checked={selectedEmailIds.has(email.id)}
                    onCheckedChange={() => handleToggleSelection(email.id)}
                    className="ml-2"
                />
                <Card 
                    className="flex-grow bg-card hover:bg-accent/20 transition-colors"
                >
                    <CardHeader 
                        className="p-3 cursor-pointer"
                        onClick={() => setSelectedEmail(email)}
                    >
                        <CardTitle className="text-base truncate">{email.subject}</CardTitle>
                        <CardDescription className="truncate">From: {email.sender}</CardDescription>
                    </CardHeader>
                </Card>
                </div>
            ))}
            </div>
        </>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold">No Emails Found</h2>
          <p className="text-muted-foreground mt-2">There are no emails in the "{decodedCategory}" category.</p>
          <p className="text-muted-foreground mt-1">It's possible you haven't scanned your inbox yet or they have been deleted.</p>
          <Link href="/dashboard" passHref>
            <Button variant="default" className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      )}

      {selectedEmail && (
        <EmailDetailDialog
            isOpen={!!selectedEmail}
            onOpenChange={(isOpen) => !isOpen && setSelectedEmail(null)}
            email={selectedEmail}
        />
      )}

      <DeleteConfirmationDialog 
        isOpen={isConfirmationOpen}
        onOpenChange={setIsConfirmationOpen}
        onConfirm={handleDelete}
        emailCount={selectedEmailIds.size}
      />
    </div>
  );
}
