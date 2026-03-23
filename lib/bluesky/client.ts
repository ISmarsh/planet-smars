/**
 * Bluesky posting client.
 *
 * Wraps @atproto/api with the patterns proven in bio's crosspost workflow:
 * auth via App Password, RichText facet detection, link card embeds,
 * and reply threading.
 *
 * Usage:
 *   import { createClient, post } from '../../.toolbox/lib/bluesky/client';
 *   const agent = await createClient({ handle, appPassword });
 *   const result = await post(agent, { text: 'Hello Bluesky!' });
 */
import { AtpAgent, RichText } from '@atproto/api';
import type { BlueskyCredentials, BlueskyPost, PostResult } from './types';

const BLUESKY_SERVICE = 'https://bsky.social';

/**
 * Create and authenticate a Bluesky agent.
 * Uses App Password auth (not OAuth) -- one password per bot, stored in GHA secrets.
 */
export async function createClient(
  credentials: BlueskyCredentials,
): Promise<AtpAgent> {
  const agent = new AtpAgent({ service: BLUESKY_SERVICE });
  await agent.login({
    identifier: credentials.handle,
    password: credentials.appPassword,
  });
  return agent;
}

/**
 * Read credentials from environment variables.
 * Throws if required vars are missing (unless dryRun is true).
 */
export function credentialsFromEnv(dryRun = false): BlueskyCredentials {
  const handle = process.env.BLUESKY_HANDLE ?? '';
  const appPassword = process.env.BLUESKY_APP_PASSWORD ?? '';

  if (!dryRun && (!handle || !appPassword)) {
    throw new Error('Missing BLUESKY_HANDLE or BLUESKY_APP_PASSWORD env vars.');
  }

  return { handle, appPassword };
}

/**
 * Post to Bluesky with automatic facet detection and optional link card embed.
 *
 * Handles:
 * - RichText facet detection (links, mentions, hashtags become clickable)
 * - Link card embeds (app.bsky.embed.external)
 * - Reply threading (root + parent references)
 */
export async function post(
  agent: AtpAgent,
  blueskyPost: BlueskyPost,
): Promise<PostResult> {
  const rt = new RichText({ text: blueskyPost.text });
  await rt.detectFacets(agent);

  const params: Record<string, unknown> = {
    text: rt.text,
    facets: rt.facets,
    createdAt: new Date().toISOString(),
  };

  if (blueskyPost.embed) {
    params.embed = {
      $type: 'app.bsky.embed.external',
      external: {
        uri: blueskyPost.embed.uri,
        title: blueskyPost.embed.title,
        description: blueskyPost.embed.description,
      },
    };
  }

  if (blueskyPost.replyTo) {
    params.reply = {
      root: {
        uri: blueskyPost.replyTo.uri,
        cid: blueskyPost.replyTo.cid,
      },
      parent: {
        uri: blueskyPost.replyTo.uri,
        cid: blueskyPost.replyTo.cid,
      },
    };
  }

  const response = await agent.post(params);
  return { uri: response.uri, cid: response.cid };
}

/**
 * Post a thread (array of posts where each replies to the previous).
 * Returns all post results in order.
 */
export async function postThread(
  agent: AtpAgent,
  posts: BlueskyPost[],
): Promise<PostResult[]> {
  const results: PostResult[] = [];

  for (const threadPost of posts) {
    const replyTo =
      results.length > 0 ? results[results.length - 1] : threadPost.replyTo;

    const result = await post(agent, {
      ...threadPost,
      replyTo,
    });
    results.push(result);
  }

  return results;
}
