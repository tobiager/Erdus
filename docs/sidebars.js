/* eslint-env node */
module.exports = {
  docs: [
    'getting-started',
    {
      type: 'category',
      label: 'User Guide',
      items: [
        'recipes',
        'faq',
      ],
    },
    {
      type: 'category', 
      label: 'Technical Documentation',
      items: [
        'architecture',
        {
          type: 'link',
          label: 'API Reference',
          href: 'https://github.com/tobiager/Erdus/blob/main/API.md',
        },
        {
          type: 'link',
          label: 'Installation Guide',
          href: 'https://github.com/tobiager/Erdus/blob/main/INSTALLATION.md',
        },
        {
          type: 'link',
          label: 'Development Guide',
          href: 'https://github.com/tobiager/Erdus/blob/main/DEVELOPMENT.md',
        },
        {
          type: 'link',
          label: 'Deployment Guide',
          href: 'https://github.com/tobiager/Erdus/blob/main/DEPLOYMENT.md',
        },
      ],
    },
    {
      type: 'category',
      label: 'Project Information',
      items: [
        {
          type: 'link',
          label: 'Changelog',
          href: 'https://github.com/tobiager/Erdus/blob/main/CHANGELOG.md',
        },
        {
          type: 'link',
          label: 'Contributing',
          href: 'https://github.com/tobiager/Erdus/blob/main/CONTRIBUTING.md',
        },
        {
          type: 'link',
          label: 'Security Policy',
          href: 'https://github.com/tobiager/Erdus/blob/main/SECURITY.md',
        },
        {
          type: 'link',
          label: 'License',
          href: 'https://github.com/tobiager/Erdus/blob/main/LICENSE',
        },
      ],
    },
  ],
};
