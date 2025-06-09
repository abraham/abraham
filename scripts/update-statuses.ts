import { updateReadme } from './utils/markdown';
import { getStatuses } from './utils/mastodon';

const { MASTODON_ACCESS_TOKEN, MASTODON_SERVER_URL, MASTODON_ACCOUNT_ID } = process.env;

async function main() {
  if (!MASTODON_ACCESS_TOKEN) {
    throw new Error('MASTODON_ACCESS_TOKEN is not defined');
  }

  if (!MASTODON_SERVER_URL) {
    throw new Error('MASTODON_SERVER_URL is not defined');
  }

  if (!MASTODON_ACCOUNT_ID) {
    throw new Error('MASTODON_ACCOUNT_ID is not defined');
  }

  const response = await getStatuses({
    accessToken: MASTODON_ACCESS_TOKEN,
    serverUrl: MASTODON_SERVER_URL,
    accountId: MASTODON_ACCOUNT_ID,
  });
  const { data, account } = response;
  const content = await updateReadme(data, account, []);
}

main();
