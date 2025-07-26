'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { CategorizedEmail } from '@/components/dashboard/MailSweepDashboard';

interface CategorizedEmailsContextType {
  categorizedEmails: CategorizedEmail[];
  setCategorizedEmails: (emails: CategorizedEmail[]) => void;
}

const CategorizedEmailsContext = createContext<CategorizedEmailsContextType | undefined>(undefined);

export const CategorizedEmailsProvider = ({ children }: { children: ReactNode }) => {
  const [categorizedEmails, setCategorizedEmails] = useState<CategorizedEmail[]>([]);

  return (
    <CategorizedEmailsContext.Provider value={{ categorizedEmails, setCategorizedEmails }}>
      {children}
    </CategorizedEmailsContext.Provider>
  );
};

export const useCategorizedEmails = () => {
  const context = useContext(CategorizedEmailsContext);
  if (context === undefined) {
    throw new Error('useCategorizedEmails must be used within a CategorizedEmailsProvider');
  }
  return context;
};
