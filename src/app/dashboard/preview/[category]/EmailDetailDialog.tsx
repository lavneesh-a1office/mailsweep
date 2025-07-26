
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CategorizedEmail } from "@/components/dashboard/MailSweepDashboard";

interface EmailDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  email: CategorizedEmail;
}

export default function EmailDetailDialog({
  isOpen,
  onOpenChange,
  email,
}: EmailDetailDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="truncate">{email.subject}</DialogTitle>
          <DialogDescription>
            From: {email.sender} | Date: {new Date(email.date).toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        <div className="prose prose-sm max-w-none h-[400px] overflow-y-auto p-2 border rounded-md bg-muted/50">
           <pre className="whitespace-pre-wrap break-words text-sm text-foreground">{email.body}</pre>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

