module.exports = {
  title: 'Erdus Docs',
  url: 'https://tobiager.github.io',
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  organizationName: 'tobiager',
  projectName: 'Erdus',
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: { sidebarPath: require.resolve('./sidebars.js') },
        theme: { customCss: [] }
      }
    ],
  ],
};
