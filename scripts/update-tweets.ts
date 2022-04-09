import { Client } from 'twitter-api-sdk';

const { TWITTER_BEARER_TOKEN } = process.env;

if (!TWITTER_BEARER_TOKEN) {
  throw new Error('TWITTER_BEARER_TOKEN is not defined');
}

const client = new Client(TWITTER_BEARER_TOKEN);
