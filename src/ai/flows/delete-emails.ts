'use server';

/**
 * @fileOverview Deletes emails from the user's Gmail account.
 *
 * - deleteEmails - Deletes emails using a provided access token and a list of email IDs.
 * - DeleteEmailsInput - The input type for the deleteEmails function.
 * - DeleteEmailsOutput - The return type for the deleteEmails function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DeleteEmailsInputSchema = z.object({
  accessToken: z.string().describe('The Google API access token.'),
  emailIds: z.array(z.string()).describe('A list of email IDs to delete.'),
});
export type DeleteEmailsInput = z.infer<typeof DeleteEmailsInputSchema>;

const DeleteEmailsOutputSchema = z.object({
  success: z.boolean(),
  deletedCount: z.number(),
});
export type DeleteEmailsOutput = z.infer<typeof DeleteEmailsOutputSchema>;


const deleteEmailsFlow = ai.defineFlow(
  {
    name: 'deleteEmailsFlow',
    inputSchema: DeleteEmailsInputSchema,
    outputSchema: DeleteEmailsOutputSchema,
  },
  async ({ accessToken, emailIds }) => {
    if (emailIds.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    // Gmail API allows batching up to 1000 IDs per request
    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/batchDelete', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids: emailIds }),
    });

    if (!response.ok) {
        // Even if some fail, we don't get a granular response here.
        // It's either all succeed or all fail.
        console.error('Failed to delete emails:', await response.text());
        throw new Error('Failed to delete emails from Gmail.');
    }

    return { success: true, deletedCount: emailIds.length };
  }
);

export async function deleteEmails(input: DeleteEmailsInput): Promise<DeleteEmailsOutput> {
    return deleteEmailsFlow(input);
}
