/**
 * Font loader for OG images.
 * Fetches TTF fonts from Google Fonts — Satori (next/og) only supports TTF/OTF.
 */

type FontWeight = 400 | 600 | 700;
type FontStyle = 'normal' | 'italic';

async function loadGoogleFont(
  family: string,
  weight: FontWeight,
  style: FontStyle = 'normal',
): Promise<ArrayBuffer> {
  const ital = style === 'italic' ? 1 : 0;
  const params = new URLSearchParams({
    family: `${family}:ital,wght@${ital},${weight}`,
    display: 'swap',
  });

  const css = await fetch(`https://fonts.googleapis.com/css2?${params}`, {
    headers: {
      // Old Safari UA forces Google Fonts to return TTF (Satori-compatible)
      'User-Agent':
        'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1',
    },
  }).then((r) => r.text());

  const url = css.match(/src: url\((.+?)\) format\('truetype'\)/)?.[1];
  if (!url) throw new Error(`Could not extract font URL for ${family} ${weight}`);

  return fetch(url).then((r) => r.arrayBuffer());
}

export async function loadOgFonts() {
  const [playfairBold, playfairBoldItalic, sourceSerifRegular, sourceSerifSemibold] =
    await Promise.all([
      loadGoogleFont('Playfair Display', 700),
      loadGoogleFont('Playfair Display', 700, 'italic'),
      loadGoogleFont('Source Serif 4', 400),
      loadGoogleFont('Source Serif 4', 600),
    ]);

  return [
    { name: 'Playfair Display', data: playfairBold, weight: 700 as const, style: 'normal' as const },
    { name: 'Playfair Display', data: playfairBoldItalic, weight: 700 as const, style: 'italic' as const },
    { name: 'Source Serif 4', data: sourceSerifRegular, weight: 400 as const, style: 'normal' as const },
    { name: 'Source Serif 4', data: sourceSerifSemibold, weight: 600 as const, style: 'normal' as const },
  ];
}
