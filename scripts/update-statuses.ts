import { readFile } from 'fs/promises';
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

  // Check if the first status ID already exists in the current README
  if (data.length > 0) {
    const firstStatusId = data[0].id;
    try {
      const currentReadme = await readFile('README.md', 'utf8');

      // If the first status ID is already in the README, don't update
      if (currentReadme.includes(firstStatusId)) {
        console.log(`Status ${firstStatusId} already exists in README.md, skipping update.`);
        return;
      }
    } catch (error) {
      // If README doesn't exist or can't be read, proceed with update
      console.log('Could not read existing README.md, proceeding with update.');
    }
  }

  const content = await updateReadme(data, account, []);
}

main();
