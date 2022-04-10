import { readFile, writeFile } from 'fs/promises';
import { template } from 'underscore';
import { Media, Tweet, User } from './twitter';

enum File {
  README = 'README.md',
  README_TEMPLATE = 'README.md.erb',
  TWEET_TEMPLATE = 'scripts/utils/tweet.md.erb',
}

function buildImage(attachments: Tweet['attachments'], media: Media = []) {
  if (!attachments || !attachments.media_keys || !attachments.media_keys.length) {
    return false;
  }

  const mediaKey = attachments.media_keys[0];
  const mediaItem = media.find((item) => item.media_key === mediaKey);

  if (!mediaItem) {
    return false;
  }

  // TODO: Improve types
  const { alt_text, url } = mediaItem as any;

  return {
    altText: alt_text || 'No alt text provided',
    url,
  };
}

function buildDate(date: string) {
  const options: Intl.DateTimeFormatOptions = {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'UTC',
  };
  return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
}

function buildMetrics(metrics: Tweet['public_metrics']) {
  const { retweet_count, reply_count, like_count, quote_count } = metrics || {};
  const merged_retweet_count = (retweet_count || 0) + (quote_count || 0);

  return {
    retweetCount: merged_retweet_count ? ` ${merged_retweet_count}` : '',
    replyCount: reply_count ? ` ${reply_count}` : '',
    likeCount: like_count ? ` ${like_count}` : '',
  };
}

async function buildTweet(tweet: Tweet, user: User, media: Media) {
  const data = {
    avatar: {
      altText: `${user.name}'s avatar`,
      url: user.profile_image_url?.replace('_normal', '_mini'),
    },
    image: buildImage(tweet.attachments, media),
    tweet: {
      id: tweet.id,
      text: tweet.text,
      date: buildDate(tweet.created_at!),
      url: `https://twitter.com/${user.username}/status/${tweet.id}`,
    },
    metrics: buildMetrics(tweet.public_metrics),
    user: {
      name: user.name,
      url: `https://twitter.com/${user.username}`,
      username: user.username,
    },
  };
  const compiled = await getTemplate(File.TWEET_TEMPLATE);
  return compiled(data);
}

async function getTemplate(templatePath: File) {
  return template(await readFile(templatePath, 'utf8'));
}

async function writeReadmeContents(tweets: string) {
  const compiled = await getTemplate(File.README_TEMPLATE);
  const content = compiled({ tweets, lastUpdated: buildDate(new Date().toISOString()) });
  return writeFile(File.README, content, 'utf8');
}

export async function updateReadme(tweets: Tweet[], user: User, media: Media) {
  const tweetList = tweets.map((tweet) => buildTweet(tweet, user, media));
  const renderedTweets = await Promise.all(tweetList);
  await writeReadmeContents(renderedTweets.join('\n\n---\n\n'));
  return tweetList;
}
