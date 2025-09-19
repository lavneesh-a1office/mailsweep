"use server";

/**
 * @fileOverview Fetches emails from the user's Gmail account.
 *
 * - fetchEmails - Fetches emails using a provided access token.
 * - FetchEmailsInput - The input type for the fetchEmails function.
 * - FetchEmailsOutput - The return type for the fetchEmails function.
 */

import pLimit from "p-limit";

import { ai } from "@/ai/genkit";
import type { Email } from "@/lib/types";
import {
  Output,
  MessagePart,
  OutputSchema,
  FetchEmailsInput,
  FetchEmailOutputSchema,
  FetchEmailsInputSchema,
  FetchEmailsOutputSchema,
} from "@/ai/flows/zod-schemas";

const limit = pLimit(60);

const getHeader = (payload: MessagePart, name: string) => {
  return payload.headers.find((header) => header.name === name)?.value ?? "";
};

const getBody = (payload: MessagePart): string => {
  if (payload.parts && payload.parts.length > 0) {
    const plainPart = payload.parts.find((p) => p.mimeType === "text/plain");
    if (plainPart?.body?.data) {
      return Buffer.from(plainPart.body.data, "base64").toString("utf-8");
    }

    const htmlPart = payload.parts.find((p) => p.mimeType === "text/html");
    if (htmlPart?.body?.data) {
      return Buffer.from(htmlPart.body.data, "base64").toString("utf-8");
    }
  }

  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8");
  }

  return "";
};

async function getEmailDetails(
  messageId: string,
  accessToken: string
): Promise<Email | null> {
  const response = await fetch(
    `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    console.error(`Failed to fetch email ${messageId}:`, await response.text());
    return null;
  }
  const responseData: unknown = await response.json();

  const parsedData = FetchEmailOutputSchema.safeParse(responseData);
  if (parsedData.error) {
    throw new Error(parsedData.error.message);
  }

  const { id, payload } = parsedData.data;

  return {
    id,
    date: getHeader(payload, "Date"),
    sender: getHeader(payload, "From"),
    subject: getHeader(payload, "Subject"),
    body: getBody(payload).substring(0, 500),
  };
}

const fetchEmailsFlow = ai.defineFlow(
  {
    name: "fetchEmailsFlow",
    outputSchema: OutputSchema,
    inputSchema: FetchEmailsInputSchema,
  },
  async ({ accessToken, pageToken }) => {
    let url =
      "https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=500&q=-in:trash";
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }

    const listResponse = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!listResponse.ok) {
      console.error("Failed to list emails:", await listResponse.text());
      throw new Error("Failed to list emails from Gmail.");
    }
    const responseData: unknown = await listResponse.json();

    const parsedData = FetchEmailsOutputSchema.safeParse(responseData);
    if (parsedData.error) {
      throw new Error(parsedData.error.message);
    }

    const { messages, nextPageToken } = parsedData.data;
    if (!messages) {
      return { emails: [], nextPageToken: undefined };
    }

    const emails = (
      await Promise.all(
        messages.map((message) =>
          limit(() => getEmailDetails(message.id, accessToken))
        )
      )
    ).filter((e): e is Email => e !== null);

    return { emails, nextPageToken };
  }
);

export async function fetchEmails(input: FetchEmailsInput): Promise<Output> {
  return fetchEmailsFlow(input);
}
