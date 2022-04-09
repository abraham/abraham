import { readFile, writeFile } from 'fs/promises';
import { template } from 'underscore';
import { Media, Tweet, User } from './twitter';

enum Template {
  README = 'README.md.erb',
  TWEET = 'scripts/utils/tweet.md.erb',
}

const README = 'README.md';

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
    user: {
      name: user.name,
      url: `https://twitter.com/${user.username}`,
      username: user.username,
    },
  };
  const compiled = await getTemplate(Template.TWEET);
  return compiled(data);
}

async function getTemplate(templatePath: Template) {
  return template(await readFile(templatePath, 'utf8'));
}

async function writeReadmeContents(tweets: string) {
  const compiled = await getTemplate(Template.README);
  const content = compiled({ tweets });
  return writeFile(README, content, 'utf8');
}

export async function updateReadme(tweets: Tweet[], user: User, media: Media) {
  const tweetList = tweets.map((tweet) => buildTweet(tweet, user, media));
  const renderedTweets = await Promise.all(tweetList);
  await writeReadmeContents(renderedTweets.join('\n\n---\n\n'));
  return tweetList;
}
