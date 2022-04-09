import { Client } from 'twitter-api-sdk';
import { TwitterParams, TwitterResponse, usersIdTweets } from 'twitter-api-sdk/dist/types';

export type DataAndIncludes = Required<Pick<TwitterResponse<usersIdTweets>, 'data' | 'includes'>>;
export type Tweets = DataAndIncludes['data'];
export type Tweet = Tweets[number];
export type Users = DataAndIncludes['includes']['users'] & { length: 1 };
export type User = Users[number];
export type Media = DataAndIncludes['includes']['media'];

export async function getTweets({
  token,
  userId,
}: {
  token: string;
  userId: string;
}): Promise<DataAndIncludes> {
  const client = new Client(token);
  const config: TwitterParams<usersIdTweets> = {
    max_results: 20,
    exclude: ['replies', 'retweets'],
    expansions: ['attachments.media_keys', 'author_id'],
    'tweet.fields': ['author_id', 'created_at', 'entities', 'id'],
    'user.fields': ['name', 'username', 'profile_image_url'],
    'media.fields': ['alt_text', 'url'],
  };
  const response = await client.tweets.usersIdTweets(userId, config);

  if (!response.data) {
    throw new Error('Response data is missing');
  }

  if (!response.includes) {
    throw new Error('Response includes is missing');
  }

  if (!response.includes.users) {
    throw new Error('Response includes users is missing');
  }

  return response as DataAndIncludes;
}
