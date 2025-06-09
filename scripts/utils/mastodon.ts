import { createRestAPIClient } from 'masto';
import type { mastodon } from 'masto';

// Re-export types from masto for consistency with the existing codebase
export type MastodonStatus = mastodon.v1.Status;
export type MastodonAccount = mastodon.v1.Account;
export type MastodonMediaAttachment = mastodon.v1.MediaAttachment;

export interface MastodonApiResponse {
  data: MastodonStatus[];
  account: MastodonAccount;
}

export type Statuses = MastodonStatus[];
export type Status = MastodonStatus;
export type User = MastodonAccount;
export type Media = MastodonMediaAttachment[];

export async function getStatuses({
  accessToken,
  serverUrl,
  accountId,
}: {
  accessToken: string;
  serverUrl: string;
  accountId: string;
}): Promise<MastodonApiResponse> {
  const client = createRestAPIClient({
    url: serverUrl,
    accessToken,
  });

  // Get the account info
  const account = await client.v1.accounts.$select(accountId).fetch();
  
  // Get the account's statuses
  const statuses = await client.v1.accounts.$select(accountId).statuses.list({
    limit: 5,
    excludeReplies: true,
    excludeReblogs: true,
  });

  if (!statuses || statuses.length === 0) {
    throw new Error('No statuses found');
  }

  return {
    data: statuses,
    account: account,
  };
}