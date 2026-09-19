// Synthetic source snapshot at commit aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.
const MAX_VALUE_LENGTH = 64;
export function acceptsInvitation(invitation, now) {
  if (!invitation?.value) return false;
  if (invitation.value.length > MAX_VALUE_LENGTH) return false;
  return true;
}
