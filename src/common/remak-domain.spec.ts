import {
  rewriteLegacyRemakUrl,
  rewriteLegacyRemakUrlsInText,
} from './remak-domain';

describe('rewriteLegacyRemakUrl', () => {
  it.each([
    ['https://remak.io', 'https://remak.abys.dev'],
    [
      'https://api.remak.io/v1/documents',
      'https://api.remak.abys.dev/v1/documents',
    ],
    [
      'http://image.remak.io:8080/image/1',
      'http://image.remak.abys.dev:8080/image/1',
    ],
    ['//image.remak.io/image/1', '//image.remak.abys.dev/image/1'],
    ['api.remak.io/v1/documents', 'api.remak.abys.dev/v1/documents'],
    [
      'https://user:password@api.remak.io/private',
      'https://user:password@api.remak.abys.dev/private',
    ],
  ])('rewrites a legacy Remak URL: %s', (legacyUrl, expected) => {
    expect(rewriteLegacyRemakUrl(legacyUrl)).toBe(expected);
  });

  it.each([
    'https://notremak.io/image/1',
    'https://api.remak.io.evil.com/image/1',
    'https://example.com/?domain=remak.io',
    'user@remak.io',
    'This text mentions https://api.remak.io/image/1',
  ])(
    'does not rewrite a value whose hostname is not legacy Remak: %s',
    (url) => {
      expect(rewriteLegacyRemakUrl(url)).toBe(url);
    },
  );

  it('rewrites only the hostname, not a matching query value', () => {
    expect(
      rewriteLegacyRemakUrl(
        'https://api.remak.io/redirect?domain=remak.io#remak.io',
      ),
    ).toBe('https://api.remak.abys.dev/redirect?domain=remak.io#remak.io');
  });

  it.each([null, undefined])('preserves %s', (value) => {
    expect(rewriteLegacyRemakUrl(value)).toBe(value);
  });
});

describe('rewriteLegacyRemakUrlsInText', () => {
  it('rewrites only legacy Remak URL hostnames in persisted HTML', () => {
    const html = [
      '<img src="https://image.remak.io/document/1">',
      '<img src="//cdn.remak.io/document/2">',
      '<a href="https://notremak.io">similar domain</a>',
      '<a href="https://api.remak.io.evil.com">domain suffix attack</a>',
      '<a href="https://example.com/?domain=remak.io">query value</a>',
      '<p>Plain remak.io text</p>',
    ].join('');

    expect(rewriteLegacyRemakUrlsInText(html)).toBe(
      [
        '<img src="https://image.remak.abys.dev/document/1">',
        '<img src="//cdn.remak.abys.dev/document/2">',
        '<a href="https://notremak.io">similar domain</a>',
        '<a href="https://api.remak.io.evil.com">domain suffix attack</a>',
        '<a href="https://example.com/?domain=remak.io">query value</a>',
        '<p>Plain remak.io text</p>',
      ].join(''),
    );
  });

  it('does not rewrite a nested URL inside another URL query string', () => {
    const url =
      'https://example.com/redirect?next=https://api.remak.io/documents/1';

    expect(rewriteLegacyRemakUrlsInText(url)).toBe(url);
  });

  it.each([null, undefined])('preserves %s', (value) => {
    expect(rewriteLegacyRemakUrlsInText(value)).toBe(value);
  });
});
