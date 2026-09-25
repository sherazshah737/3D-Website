// Site-wide settings you are most likely to change.
export const CONFIG = {
  // Hero fallback video, used on low-power devices / no WebGL.
  // Sources are tried in order: run `npm run fetch:video` to self-host the
  // clip (recommended — faster + no third-party dependency), otherwise the
  // remote copy is used.
  heroVideo: [
    { src: '/video/hero-loop.webm', type: 'video/webm' },
    { src: '/video/hero-loop.mp4', type: 'video/mp4' },
    {
      src: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_051048_5ef213b5-26db-4da8-b604-7ef823760b6b.mp4',
      type: 'video/mp4',
    },
  ],

  // Contact form delivery. See README → "Contact form".
  //   'mailto'    — opens the visitor's mail app (works on any host, no backend)
  //   'netlify'   — Netlify Forms (form markup already has data-netlify)
  //   'endpoint'  — POST JSON to `formEndpoint` (Formspree, Getform, your API…)
  //   'php'       — POST to /contact.php (cPanel / shared hosting)
  formProvider: 'mailto',
  formEndpoint: '',
  contactEmail: 'hello@devforc.com',
};
