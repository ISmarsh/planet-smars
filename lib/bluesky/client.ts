/**
 * Bluesky posting client.
 *
 * Wraps @atproto/api with the patterns proven in bio's crosspost workflow:
 * auth via App Password, RichText facet detection, link card embeds,
 * and reply threading.
 *
 * NOTE: This module imports @atproto/api which is NOT listed in toolbox's
 * package.json (toolbox is a submodule, not a standalone package). Consuming
 * projects must install @atproto/api as their own dependency.
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
    const parent = {
      uri: blueskyPost.replyTo.uri,
      cid: blueskyPost.replyTo.cid,
    };
    const root = blueskyPost.replyTo.root
      ? { uri: blueskyPost.replyTo.root.uri, cid: blueskyPost.replyTo.root.cid }
      : parent;

    params.reply = { root, parent };
  }

  const response = await agent.post(params);
  return { uri: response.uri, cid: response.cid };
}

/**
 * Post a thread (array of posts where each replies to the previous).
 * Correctly sets reply.root to the first post and reply.parent to the
 * immediately preceding post, so Bluesky clients group the thread properly.
 *
 * Returns all post results in order.
 */
export async function postThread(
  agent: AtpAgent,
  posts: BlueskyPost[],
): Promise<PostResult[]> {
  const results: PostResult[] = [];

  for (const threadPost of posts) {
    let replyTo = threadPost.replyTo;

    if (results.length > 0) {
      // root = first post in thread, parent = immediately preceding post
      const root = results[0];
      const parent = results[results.length - 1];
      replyTo = { uri: parent.uri, cid: parent.cid, root };
    }

    const result = await post(agent, {
      ...threadPost,
      replyTo,
    });
    results.push(result);
  }

  return results;
}
