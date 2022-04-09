import { readFile, writeFile } from 'fs/promises';
import { Media, Tweet, User } from './twitter';

enum ReadmeSentinel {
  TWEETS_START = '<!-- TWEETS_START -->',
  TWEETS_END = '<!-- TWEETS_END -->',
}

function buildImage(attachments: Tweet['attachments'], media: Media = []) {
  if (!attachments || !attachments.media_keys || !attachments.media_keys.length) {
    return '';
  }

  const mediaKey = attachments.media_keys[0];
  const mediaItem = media.find((item) => item.media_key === mediaKey);

  if (!mediaItem) {
    return '';
  }

  // TODO: Improve types
  const { alt_text, url } = mediaItem as any;

  return `
> ![${alt_text || 'Unknown alt text'}](${url})
>`;
}

function mdUrl(text: string, link: string) {
  return `[${text}](${link})`;
}

function template(tweet: Tweet, user: User, media: Media) {
  const profileUrl = `https://twitter.com/${user.username}`;
  const tweetUrl = `https://twitter.com/${user.username}/status/${tweet.id}`;
  const avatar = `![${user.name}'s avatar](${user.profile_image_url})`;
  const date = new Intl.DateTimeFormat().format(new Date(tweet.created_at!));
  const replyUrl = `https://twitter.com/intent/tweet?in_reply_to=${tweet.id}`;
  const retweetUrl = `https://twitter.com/intent/retweet?tweet_id=${tweet.id}`;
  const likeUrl = `https://twitter.com/intent/favorite?tweet_id=${tweet.id}`;
  const image = buildImage(tweet.attachments, media);

  return `
> ${mdUrl(avatar, profileUrl)} ${mdUrl(user.name, profileUrl)} ${mdUrl(
    `@${user.username}`,
    profileUrl
  )} ${mdUrl(date, tweetUrl)}
>
> ${tweet.text}
> ${image}
> ${mdUrl('reply', replyUrl)} ${mdUrl('retweet', retweetUrl)} ${mdUrl('like', likeUrl)}
  `.trim();
}

async function getReadmeContents() {
  const contents = await readFile('README.md', 'utf8');
  const [start] = contents.split(ReadmeSentinel.TWEETS_START);
  const [, end] = contents.split(ReadmeSentinel.TWEETS_END);
  return {
    start,
    end,
  };
}

async function writeReadmeContents(middle: string) {
  const { start, end } = await getReadmeContents();

  const content = `${start}${ReadmeSentinel.TWEETS_START}
${middle}
${ReadmeSentinel.TWEETS_END}${end}`;

  return writeFile('README.md', content, 'utf8');
}

export async function updateReadme(tweets: Tweet[], user: User, media: Media) {
  const middle = tweets.map((tweet) => template(tweet, user, media)).join('\n\n---\n\n');

  await writeReadmeContents(middle);
  return middle;
}
