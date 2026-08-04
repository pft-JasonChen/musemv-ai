// Shared convention for "click an avatar/username anywhere → go to that
// person's Community Profile" (Figma nodes 1711:42478 "other user, no More
// icon" vs 1711:43159 "own profile, has More icon"). This app only has one
// mock signed-in identity ("ScottWu", used everywhere a piece of content's
// "own creation" needs a creator name) — any other username is treated as
// someone else's profile.
export const CURRENT_USERNAME = 'ScottWu'

export function isOwnUsername(username: string): boolean {
  return username === CURRENT_USERNAME
}

export function communityProfileHref(username: string): string {
  return isOwnUsername(username) ? '/community-profile' : `/community-profile?user=${encodeURIComponent(username)}`
}
