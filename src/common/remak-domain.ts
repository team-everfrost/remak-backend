const LEGACY_REMAK_URL_PATTERN = new RegExp(
  '^((?:(?:[a-z][a-z\\d+.-]*:)?//)(?:[^/?#\\s\'"<>@]*@)?|)' +
    '((?:[a-z\\d](?:[a-z\\d-]*[a-z\\d])?\\.)*)remak\\.io' +
    '(?![a-z\\d._@-])',
  'i',
);

const URL_IN_TEXT_PATTERN = /(?:[a-z][a-z\d+.-]*:)?\/\/[^\s'"<>]+/gi;

/**
 * Rewrites the hostname only when the value itself is a Remak URL or host.
 * Paths and query values containing `remak.io` are intentionally left intact.
 */
export function rewriteLegacyRemakUrl(
  value: string | null | undefined,
): string | null | undefined {
  if (typeof value !== 'string') {
    return value;
  }

  return value.replace(
    LEGACY_REMAK_URL_PATTERN,
    (_, prefix: string, subdomains: string) =>
      `${prefix}${subdomains}remak.abys.dev`,
  );
}

/**
 * Rewrites Remak hostnames in absolute and protocol-relative URLs embedded in
 * arbitrary text, such as persisted HTML. Plain text and query-only values are
 * not treated as hostnames.
 */
export function rewriteLegacyRemakUrlsInText(
  value: string | null | undefined,
): string | null | undefined {
  if (typeof value !== 'string') {
    return value;
  }

  return value.replace(URL_IN_TEXT_PATTERN, (url) =>
    rewriteLegacyRemakUrl(url),
  );
}
