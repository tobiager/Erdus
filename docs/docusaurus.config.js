/* eslint-env node */
module.exports = {
  title: 'Erdus Documentation',
  tagline: 'Universal ER Diagram Converter',
  url: 'https://tobiager.github.io',
  baseUrl: '/Erdus/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'tobiager',
  projectName: 'Erdus',
  
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: { 
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/tobiager/Erdus/tree/main/docs/',
        },
        blog: false,
        theme: { 
          customCss: require.resolve('./src/css/custom.css') 
        }
      }
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Erdus',
      logo: {
        alt: 'Erdus Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'doc',
          docId: 'getting-started',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://erdus-inky.vercel.app',
          label: 'Web App',
          position: 'right',
        },
        {
          href: 'https://github.com/tobiager/Erdus',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started',
            },
            {
              label: 'Architecture',
              to: '/docs/architecture',
            },
            {
              label: 'API Reference',
              href: 'https://github.com/tobiager/Erdus/blob/main/API.md',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub Issues',
              href: 'https://github.com/tobiager/Erdus/issues',
            },
            {
              label: 'Discussions',
              href: 'https://github.com/tobiager/Erdus/discussions',
            },
            {
              label: 'Contributing',
              href: 'https://github.com/tobiager/Erdus/blob/main/CONTRIBUTING.md',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Web App',
              href: 'https://erdus-inky.vercel.app',
            },
            {
              label: 'Examples',
              href: 'https://github.com/tobiager/Erdus/tree/main/examples',
            },
            {
              label: 'Releases',
              href: 'https://github.com/tobiager/Erdus/releases',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Erdus. Built with Docusaurus.`,
    },
    prism: {
      theme: require('prism-react-renderer/themes/github'),
      darkTheme: require('prism-react-renderer/themes/dracula'),
      additionalLanguages: ['typescript', 'javascript', 'sql', 'bash'],
    },
  },
};
