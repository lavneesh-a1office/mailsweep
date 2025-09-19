"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import Login from "@/components/auth/Login";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";

import { auth } from "@/lib/firebase";
import { MailSweepLogo } from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  if (loading || user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-background">
        <MailSweepLogo className="h-16 w-16 text-primary animate-pulse" />
        <h1 className="text-2xl font-bold font-headline mt-4">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 flex justify-between items-center container mx-auto">
        <div className="flex items-center gap-2">
          <MailSweepLogo className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground font-headline">
            MailSweep
          </h1>
        </div>
        <Login />
      </header>
      <main className="flex-1 flex flex-col items-center p-4">
        <section className="text-center py-16 md:py-24">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold text-foreground font-headline mb-4">
              Reclaim Your Inbox.
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              MailSweep intelligently categorizes your emails, finds the old
              clutter, and helps you delete thousands of emails in just a few
              clicks.
            </p>
            <Login />
          </div>
        </section>

        <section className="w-full max-w-5xl mx-auto">
          <Card className="shadow-2xl border-2 border-primary/20 bg-card overflow-hidden">
            <CardContent className="p-0">
              <Image
                priority
                height={600}
                width={1200}
                className="w-full h-auto"
                alt="MailSweep Dashboard Preview"
                data-ai-hint="email inbox dashboard"
                src="https://placehold.co/1200x600.png"
              />
            </CardContent>
          </Card>
        </section>

        <section className="w-full max-w-5xl mx-auto py-16 md:py-24">
          <h3 className="text-3xl font-bold text-center mb-12 font-headline">
            How it works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card">
              <div className="bg-primary/20 p-4 rounded-full mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-2 font-headline">
                Connect Your Account
              </h4>
              <p className="text-muted-foreground">
                Securely connect your Google account in seconds. We only request
                permissions needed to scan and manage your emails.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card">
              <div className="bg-primary/20 p-4 rounded-full mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-2 font-headline">
                AI-Powered Categorization
              </h4>
              <p className="text-muted-foreground">
                Our AI automatically sorts your emails into smart categories
                like Promotions, Social, and more.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card">
              <div className="bg-primary/20 p-4 rounded-full mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-2 font-headline">
                Bulk Delete with Confidence
              </h4>
              <p className="text-muted-foreground">
                Filter by age, select categories, and delete thousands of
                unwanted emails at once. Always with a final confirmation.
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>
            © {new Date().getFullYear()} MailSweep. All rights reserved.
          </span>
          <Link
            href="https://blog.a1apps.co/privacy-policy-a1apps/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
