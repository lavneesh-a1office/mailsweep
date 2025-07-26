'use client';

import { useCategorizedEmails } from '@/hooks/useCategorizedEmails';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CategoryPreviewPage() {
  const { categorizedEmails } = useCategorizedEmails();
  const params = useParams();
  const category = params.category as string;

  const filteredEmails = useMemo(() => {
    if (!category) return [];
    const decodedCategory = decodeURIComponent(category);
    return categorizedEmails.filter(email => email.category === decodedCategory);
  }, [categorizedEmails, category]);

  if (!category) {
    return <div>Invalid category.</div>;
  }

  const decodedCategory = decodeURIComponent(category);

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="flex items-center mb-8 gap-4">
        <Link href="/dashboard" passHref>
          <Button variant="outline" size="icon" asChild>
            <a><ArrowLeft className="h-4 w-4" /></a>
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold font-headline">Email Preview</h1>
          <p className="text-muted-foreground">Showing emails in the "{decodedCategory}" category</p>
        </div>
      </header>
      
      {filteredEmails.length > 0 ? (
        <div className="space-y-4">
          {filteredEmails.map(email => (
            <Card key={email.id} className="bg-card">
              <CardHeader>
                <CardTitle className="text-lg">{email.subject}</CardTitle>
                <CardDescription>From: {email.sender} | Date: {new Date(email.date).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground truncate">{email.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold">No Emails Found</h2>
          <p className="text-muted-foreground mt-2">There are no emails in the "{decodedCategory}" category.</p>
          <p className="text-muted-foreground mt-1">It's possible you haven't scanned your inbox yet.</p>
          <Link href="/dashboard" passHref>
            <Button variant="default" className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
