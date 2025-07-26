'use server';

/**
 * @fileOverview Fetches emails from the user's Gmail account.
 *
 * - fetchEmails - Fetches emails using a provided access token.
 * - FetchEmailsInput - The input type for the fetchEmails function.
 * - FetchEmailsOutput - The return type for the fetchEmails function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Email } from '@/lib/types';

const FetchEmailsInputSchema = z.object({
  accessToken: z.string().describe('The Google API access token.'),
  pageToken: z.string().optional().describe('The page token for fetching subsequent pages of emails.'),
});
export type FetchEmailsInput = z.infer<typeof FetchEmailsInputSchema>;

const FetchEmailsOutputSchema = z.object({
  emails: z.array(
    z.object({
      id: z.string(),
      subject: z.string(),
      sender: z.string(),
      body: z.string(),
      date: z.string(),
    })
  ).describe('A list of fetched emails.'),
  nextPageToken: z.string().optional().describe('The token for the next page of results.'),
});
export type FetchEmailsOutput = z.infer<typeof FetchEmailsOutputSchema>;


async function getEmailDetails(messageId: string, accessToken: string): Promise<Email | null> {
    const response = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      console.error(`Failed to fetch email ${messageId}:`, await response.text());
      return null;
    }
    const message = await response.json();

    const getHeader = (name: string) => message.payload.headers.find((h: any) => h.name === name)?.value || '';
    
    let body = '';
    if (message.payload.parts) {
      const part = message.payload.parts.find((p: any) => p.mimeType === 'text/plain');
      if (part && part.body.data) {
        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
    } else if (message.payload.body.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    }

    return {
      id: message.id,
      subject: getHeader('Subject'),
      sender: getHeader('From'),
      date: getHeader('Date'),
      body: body.substring(0, 500), // Truncate for performance
    };
}


const fetchEmailsFlow = ai.defineFlow(
  {
    name: 'fetchEmailsFlow',
    inputSchema: FetchEmailsInputSchema,
    outputSchema: FetchEmailsOutputSchema,
  },
  async ({ accessToken, pageToken }) => {
    
    let url = 'https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=500';
    if (pageToken) {
        url += `&pageToken=${pageToken}`;
    }

    const listResponse = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!listResponse.ok) {
        console.error('Failed to list emails:', await listResponse.text());
        throw new Error('Failed to list emails from Gmail.');
    }

    const { messages, nextPageToken } = await listResponse.json();
    if (!messages) {
        return { emails: [], nextPageToken: undefined };
    }

    const emailPromises = messages.map((m: any) => getEmailDetails(m.id, accessToken));
    const emails = (await Promise.all(emailPromises)).filter(e => e !== null) as Email[];

    return { emails, nextPageToken };
  }
);

export async function fetchEmails(input: FetchEmailsInput): Promise<FetchEmailsOutput> {
    return fetchEmailsFlow(input);
}
