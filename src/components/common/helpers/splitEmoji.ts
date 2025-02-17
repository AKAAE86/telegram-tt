import EMOJI_REGEX from '../../../lib/twemojiRegex';
import fixNonStandardEmoji from '../../../util/emoji/fixNonStandardEmoji';

export function splitEmoji(str: string): [string, string, string, boolean] {
  const newStr = fixNonStandardEmoji(str);

  const matches = Array.from(newStr.matchAll(new RegExp(EMOJI_REGEX.source, 'g')));

  if (!matches.length || matches.length > 1) {
    return ['', str, str, false];
  }

  const firstMatch = matches[0];
  if (firstMatch.index === 0) {
    return [firstMatch[0], newStr.slice(firstMatch[0].length), str, true];
  }

  const lastMatch = matches[matches.length - 1];
  if (lastMatch.index! + lastMatch[0].length === newStr.length) {
    return [lastMatch[0], newStr.slice(0, lastMatch.index), str, true];
  }

  return ['', str, str, false];
}
