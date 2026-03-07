/**
 * Curated YouTube video IDs used as rewards when a player clears all 10 cards.
 * Replace the placeholder IDs with real 11-character YouTube video IDs before deploying
 * (e.g. the ID in https://www.youtube.com/watch?v=dQw4w9WgXcQ is "dQw4w9WgXcQ").
 */
export const REWARD_VIDEO_IDS: string[] = [
  'PLACEHOLDER_01',
  'PLACEHOLDER_02',
  'PLACEHOLDER_03',
  'PLACEHOLDER_04',
  'PLACEHOLDER_05',
  'PLACEHOLDER_06',
  'PLACEHOLDER_07',
  'PLACEHOLDER_08',
  'PLACEHOLDER_09',
  'PLACEHOLDER_10',
  'PLACEHOLDER_11',
  'PLACEHOLDER_12',
  'PLACEHOLDER_13',
  'PLACEHOLDER_14',
  'PLACEHOLDER_15',
  'PLACEHOLDER_16',
  'PLACEHOLDER_17',
  'PLACEHOLDER_18',
  'PLACEHOLDER_19',
  'PLACEHOLDER_20',
]

/** Returns a random video ID from the reward pool. */
export function pickRandomVideoId(): string {
  return REWARD_VIDEO_IDS[Math.floor(Math.random() * REWARD_VIDEO_IDS.length)]
}

/**
 * Builds a restricted YouTube embed URL.
 * Uses youtube-nocookie.com to reduce tracking.
 * Parameters limit related videos, disable annotations, and enable the IFrame API.
 */
export function buildEmbedUrl(videoId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3',
    disablekb: '1',
    fs: '1',
    controls: '1',
    autoplay: '1',
    enablejsapi: '1',
    origin,
  })
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`
}
