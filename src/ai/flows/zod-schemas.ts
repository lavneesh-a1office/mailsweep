import { z } from "genkit";

const FetchEmailsInputSchema = z.object({
  accessToken: z.string().describe("The Google API access token."),
  pageToken: z
    .string()
    .optional()
    .describe("The page token for fetching subsequent pages of emails."),
});
type FetchEmailsInput = z.infer<typeof FetchEmailsInputSchema>;

interface MessagePart {
  partId: string;
  filename: string;
  mimeType: string;
  parts?: MessagePart[] | undefined;
  headers: { name: string; value: string }[];
  body: {
    size: number;
    data?: string | undefined;
    attachmentId?: string | undefined;
  };
}
const MessagePartSchema: z.ZodType<MessagePart> = z.lazy(() =>
  z.object({
    partId: z.string(),
    mimeType: z.string(),
    filename: z.string(),
    headers: z.array(z.object({ name: z.string(), value: z.string() })),
    body: z.object({
      size: z.number(),
      data: z.string().optional(),
      attachmentId: z.string().optional(),
    }),
    parts: z.array(MessagePartSchema).optional(),
  })
);

const FetchEmailOutputSchema = z.object({
  id: z.string(),
  snippet: z.string(),
  threadId: z.string(),
  historyId: z.string(),
  internalDate: z.string(),
  sizeEstimate: z.number(),
  payload: MessagePartSchema,
  raw: z.string().optional(),
  labelIds: z.array(z.string()),
});

const FetchEmailsOutputSchema = z.object({
  resultSizeEstimate: z.number(),
  nextPageToken: z.string().optional(),
  messages: z.array(
    z.object({
      id: z.string(),
      threadId: z.string(),
      raw: z.string().optional(),
      snippet: z.string().optional(),
      historyId: z.string().optional(),
      internalDate: z.string().optional(),
      sizeEstimate: z.number().optional(),
      payload: MessagePartSchema.optional(),
      labelIds: z.array(z.string()).optional(),
    })
  ),
});

const OutputSchema = z.object({
  nextPageToken: z.string().optional(),
  emails: z.array(
    z.object({
      id: z.string(),
      body: z.string(),
      date: z.string(),
      sender: z.string(),
      subject: z.string(),
    })
  ),
});
type Output = z.infer<typeof OutputSchema>;

export {
  type Output,
  OutputSchema,
  type MessagePart,
  type FetchEmailsInput,
  FetchEmailOutputSchema,
  FetchEmailsInputSchema,
  FetchEmailsOutputSchema,
};
