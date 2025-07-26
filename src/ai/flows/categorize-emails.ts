'use server';

/**
 * @fileOverview Automatically categorizes emails into categories such as 'Promotions', 'Social', and 'Updates' using generative AI.
 *
 * - categorizeEmails - A function that categorizes a list of emails.
 * - CategorizeEmailsInput - The input type for the categorizeEmails function.
 * - CategorizeEmailsOutput - The return type for the categorizeEmails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeEmailsInputSchema = z.object({
  emails: z.array(
    z.object({
      subject: z.string().describe('The subject line of the email.'),
      sender: z.string().describe('The sender of the email.'),
      body: z.string().describe('The body of the email.'),
    })
  ).describe('A list of emails to categorize.'),
});
export type CategorizeEmailsInput = z.infer<typeof CategorizeEmailsInputSchema>;

const CategorizeEmailsOutputSchema = z.object({
  categories: z.array(
    z.enum(['Promotions', 'Social', 'Updates', 'Forums', 'Purchases', 'Travel', 'Other'])
  ).describe('A list of categories for the emails, in the same order as the input emails.'),
});
export type CategorizeEmailsOutput = z.infer<typeof CategorizeEmailsOutputSchema>;

export async function categorizeEmails(input: CategorizeEmailsInput): Promise<CategorizeEmailsOutput> {
  return categorizeEmailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeEmailsPrompt',
  input: {schema: CategorizeEmailsInputSchema},
  output: {schema: CategorizeEmailsOutputSchema},
  prompt: `You are an email categorization expert. Given a list of emails, you will categorize each email into one of the following categories: Promotions, Social, Updates, Forums, Purchases, Travel, Other.

  Return a JSON array of categories, in the same order as the input emails. Do not include any other text in your response.

  Here are the emails:
  {{#each emails}}
  Subject: {{{subject}}}
  Sender: {{{sender}}}
  Body: {{{body}}}
  ---
  {{/each}}`,
});

const categorizeEmailsFlow = ai.defineFlow(
  {
    name: 'categorizeEmailsFlow',
    inputSchema: CategorizeEmailsInputSchema,
    outputSchema: CategorizeEmailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
