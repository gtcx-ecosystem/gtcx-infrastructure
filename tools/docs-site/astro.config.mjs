// Astro Starlight configuration for gtcx.trade/compliance.
//
// Source-of-truth markdown lives in `docs/external/docs-site/` at the repo
// root so the public docs are version-controlled alongside the substrate
// that they describe. `scripts/sync-content.mjs` mirrors that directory
// into `src/content/docs/` before Astro reads it; we deliberately avoid
// symlinks because they break on Windows and inside Docker build layers.

import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://gtcx.trade',
  base: '/compliance',
  trailingSlash: 'ignore',
  integrations: [
    starlight({
      title: 'GTCX Compliance',
      description:
        'Compliance substrate documentation: audit-signer, compliance-db, compliance-gateway-mcp.',
      logo: {
        src: './src/assets/logo.svg',
        replacesTitle: false,
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/gtcx-ecosystem/gtcx-infrastructure',
        },
      ],
      sidebar: [
        { label: 'Overview', link: '/' },
        {
          label: 'Primitives',
          items: [
            { label: '@gtcx/audit-signer', link: '/audit-signer' },
            { label: 'terraform-aws-compliance-db', link: '/compliance-db' },
            { label: 'compliance-gateway-mcp', link: '/compliance-gateway-mcp' },
          ],
        },
        {
          label: 'Reference',
          items: [{ label: 'Architecture', link: '/architecture' }],
        },
      ],
      customCss: ['./src/styles/custom.css'],
      head: [
        {
          tag: 'meta',
          attrs: { name: 'robots', content: 'index,follow' },
        },
      ],
      editLink: {
        baseUrl:
          'https://github.com/gtcx-ecosystem/gtcx-infrastructure/edit/main/docs/external/docs-site/',
      },
      lastUpdated: true,
    }),
  ],
});
