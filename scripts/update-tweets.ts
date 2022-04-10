import { updateReadme } from './utils/markdown';
import { getTweets } from './utils/twitter';

const { TWITTER_BEARER_TOKEN, TWITTER_USER_ID } = process.env;

async function main() {
  if (!TWITTER_BEARER_TOKEN) {
    throw new Error('TWITTER_BEARER_TOKEN is not defined');
  }

  if (!TWITTER_USER_ID) {
    throw new Error('TWITTER_USER_ID is not defined');
  }

  const response = await getTweets({ token: TWITTER_BEARER_TOKEN, userId: TWITTER_USER_ID });
  const { data, includes } = response;
  const content = await updateReadme(response.data, includes.users![0], includes.media);
}

main();
