import { readFile, writeFile } from 'fs/promises';
import { template } from 'underscore';
import { Media, Status, User } from './mastodon';

enum File {
  README = 'README.md',
  README_TEMPLATE = 'README.md.erb',
  STATUS_TEMPLATE = 'scripts/utils/status.md.erb',
}

function buildImage(media_attachments: Status['mediaAttachments'] = []) {
  if (!media_attachments || !media_attachments.length) {
    return false;
  }

  // Filter to only image attachments
  const imageAttachments = media_attachments.filter((item) => item && item.type === 'image');

  if (!imageAttachments.length) {
    return false;
  }

  // For single image, return object for backward compatibility
  if (imageAttachments.length === 1) {
    const mediaItem = imageAttachments[0];
    return {
      altText: mediaItem.description || 'No alt text provided',
      url: mediaItem.url,
    };
  }

  // For multiple images, return array
  return imageAttachments.map((mediaItem) => ({
    altText: mediaItem.description || 'No alt text provided',
    url: mediaItem.url,
  }));
}

function buildDate(date: string) {
  const options: Intl.DateTimeFormatOptions = {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'UTC',
  };
  return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
}

function buildMetrics(status: Status) {
  const reblogsCount = status.reblogsCount || 0;
  const repliesCount = status.repliesCount || 0;
  const favouritesCount = status.favouritesCount || 0;

  return {
    boostCount: reblogsCount ? `&ensp;${reblogsCount}` : '',
    replyCount: repliesCount ? `&ensp;${repliesCount}` : '',
    favoriteCount: favouritesCount ? `&ensp;${favouritesCount}` : '',
  };
}

async function buildStatus(status: Status, user: User, media: Media) {
  const data = {
    avatar: {
      altText: `${user.displayName}'s avatar`,
      url: user.avatar,
    },
    image: buildImage(status.mediaAttachments),
    status: {
      id: status.id,
      text: status.content.replace(/<[^>]*>/g, ''), // Strip HTML tags from Mastodon content
      date: buildDate(status.createdAt),
      url: status.url || '',
    },
    metrics: buildMetrics(status),
    user: {
      name: user.displayName,
      url: user.url || '',
      username: user.username,
    },
  };
  const compiled = await getTemplate(File.STATUS_TEMPLATE);
  return compiled(data);
}

async function getTemplate(templatePath: File) {
  return template(await readFile(templatePath, 'utf8'));
}

async function writeReadmeContents(statuses: string) {
  const compiled = await getTemplate(File.README_TEMPLATE);
  const content = compiled({ statuses, lastUpdated: buildDate(new Date().toISOString()) });
  return writeFile(File.README, content, 'utf8');
}

export async function updateReadme(statuses: Status[], user: User, media: Media) {
  const statusList = statuses.map((status) => buildStatus(status, user, media));
  const renderedStatuses = await Promise.all(statusList);
  await writeReadmeContents(renderedStatuses.join('\n\n---\n\n'));
  return statusList;
}
