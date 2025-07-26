
'use client';

import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, User, getAdditionalUserInfo } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Login() {
  const [user, setUser] = useState<User | null>(null);
  const [isLandingPage, setIsLandingPage] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    // This check will only run on the client side
    setIsLandingPage(window.location.pathname === '/');
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
    provider.addScope('https://www.googleapis.com/auth/gmail.modify');
    try {
      const result = await signInWithPopup(auth, provider);
      const additionalInfo = getAdditionalUserInfo(result);
      
      // Store credential/token if needed, for example:
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        // You can use this token to make API calls to Google services
      }

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${result.user.displayName}!`,
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Error during Google login:', error);
      toast({
        title: 'Login Failed',
        description: 'There was an error logging in with Google. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Logout Successful',
      });
      router.push('/');
    } catch (error)
      {
      console.error('Error during logout:', error);
      toast({
        title: 'Logout Failed',
        description: 'There was an error logging out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (user) {
    // This could be a dropdown menu with user info and a logout button
    return (
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground hidden sm:block">{user.email}</p>
        <Button onClick={handleLogout} variant="outline">Logout</Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleGoogleLogin} 
      size={isLandingPage && !user ? "lg" : "default"} 
      className="bg-accent text-accent-foreground hover:bg-accent/90"
    >
      {isLandingPage && !user ? "Start Cleaning My Inbox" : "Login with Google"}
    </Button>
  );
}
