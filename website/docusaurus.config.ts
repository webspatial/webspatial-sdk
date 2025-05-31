import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type {Options as IdealImageOptions} from '@docusaurus/plugin-ideal-image';
import xGithubTheme, {emptyTheme} from './src/css/xGithubTheme';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: '//rsms.me/',
      },
    },
  ],

  stylesheets: [
    {
      href: '//rsms.me/inter/inter.css',
      type: 'text/css',
    },
  ],
  plugins: [
    'docusaurus-plugin-sass',
    [
      'docusaurus-plugin-generate-llms-txt',
      {
        outputFile: 'llms.txt', // defaults to llms.txt if not specified
      },
    ],
    '@docusaurus/theme-live-codeblock',
    [
      'ideal-image',
      {
        quality: 70,
        max: 1030,
        min: 640,
        steps: 2,
        // Use false to debug, but it incurs huge perf costs
        disableInDev: true,
      } satisfies IdealImageOptions,
    ],
    // [
    //   'docusaurus-plugin-typedoc',

    //   // Options
    //   {
    //     id: 'core-sdk',
    //     // ── begin explicit source-link settings ──

    //     // Ensure TypeDoc always generates links, even if Git auto-detection is off
    //     disableGit: true,

    //     // Template for linking to GitHub.
    //     // {path} is the file path under the SDK repo, {line} the line number.
    //     sourceLinkTemplate:
    //       'https://github.com/webspatial/webspatial-sdk/blob/main/core/src/core/{path}#L{line}',

    //     // (Optional) override the revision—use your default branch or commit SHA
    //     gitRevision: 'main',
    //     cleanOutputDir: false,

    //     // ── end explicit settings ──
    //     entryPoints: ['./XRSDK/packages/core/src/index.ts'],
    //     tsconfig: './XRSDK/packages/core/tsconfig.json',
    //     out: 'docs/api-core',
    //     sidebar: {
    //       autoConfiguration: true,
    //       pretty: true,
    //       typescript: true,
    //       deprecatedItemClassName: 'typedoc-sidebar-item-deprecated',
    //     },
    //   },
    // ],
    // [
    //   'docusaurus-plugin-typedoc',

    //   // Options
    //   {
    //     id: 'react-sdk',
    //     // ── begin explicit source-link settings ──

    //     // Ensure TypeDoc always generates links, even if Git auto-detection is off
    //     disableGit: true,

    //     // // Template for linking to GitHub.
    //     // // {path} is the file path under the SDK repo, {line} the line number.
    //     basePath: './XRSDK/packages/react/src',
    //     sourceLinkTemplate:
    //       'https://github.com/webspatial/webspatial-sdk/blob/main/react/src/{path}#L{line}',

    //     // // (Optional) override the revision—use your default branch or commit SHA
    //     gitRevision: 'main',
    //     cleanOutputDir: false,

    //     // ── end explicit settings ──
    //     entryPoints: ['./XRSDK/packages/react/src/index.ts'],
    //     tsconfig: './XRSDK/packages/react/tsconfig.json',
    //     out: 'docs/api-react',
    //     sidebar: {
    //       autoConfiguration: true,
    //       pretty: true,
    //       typescript: true,
    //       deprecatedItemClassName: 'typedoc-sidebar-item-deprecated',
    //     },
    //   },
    // ],
  ],
  title: 'My Site',
  tagline: 'Dinosaurs are cool',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://webspatial.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/webspatial-sdk/', // todo: change by env

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'webspatial', // Usually your GitHub org/user name.
  projectName: 'webspatial-sdk', // Usually your repo name.

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-Hans'],
    localeConfigs: {
      en: {htmlLang: 'en-US'},
      'zh-Hans': {htmlLang: 'zh-CN'},
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: ['./src/css/codeblock.scss', './src/css/custom.scss'],
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    algolia: {
      // todo: test only, to be replaced
      appId: 'X1Z85QJPUV',
      apiKey: 'bf7211c161e8205da2f933a02534105a',
      indexName: 'docusaurus-2',
    },
    liveCodeBlock: {
      /**
       * The position of the live playground, above or under the editor
       * Possible values: "top" | "bottom"
       */
      playgroundPosition: 'bottom',
    },
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      // title: 'My Site',
      logo: {
        alt: 'My Site Logo',
        src: 'img/logo.svg',
        srcDark: 'img/logo.dark.svg',
      },
      items: [
        {
          type: 'docsVersionDropdown',
          versions: ['current', '0.2.0', '0.1.0'],
          position: 'right',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Guide',
        },
        // {
        //   type: 'docSidebar',
        //   sidebarId: 'apiSidebar',
        //   // to: '/docs/api',
        //   label: 'API',
        //   position: 'left',
        // },
        {to: '/blog', label: 'Blog', position: 'left'},
        {to: 'showcase', label: 'Showcase', position: 'left'},
        {
          href: 'https://github.com/facebook/docusaurus',
          // label: 'GitHub',
          className: 'xheader-github-link',
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
              label: 'Tutorial',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/docusaurus',
            },
            {
              label: 'Discord',
              href: 'https://discordapp.com/invite/docusaurus',
            },
            {
              label: 'X',
              href: 'https://x.com/docusaurus',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/facebook/docusaurus',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: emptyTheme,
      darkTheme: emptyTheme,
      // theme: prismThemes.github,
      // darkTheme: prismThemes.gruvboxMaterialDark,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
