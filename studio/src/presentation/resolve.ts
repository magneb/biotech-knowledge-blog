import {
  defineDocuments,
  defineLocations,
  type PresentationPluginOptions,
} from 'sanity/presentation'

export const resolve: PresentationPluginOptions['resolve'] = {
  mainDocuments: defineDocuments([
    {
      route: '/',
      filter: `_type == "homePage" && _id == "homePage"`,
    },
    {
      route: '/contents',
      filter: `_type in ["chapter", "topic"]`,
    },
    {
      route: '/:slug',
      filter: `_type == "article" && slug.current == $slug`,
    },
  ]),
  locations: {
    homePage: defineLocations({
      locations: [{title: 'Home Page', href: '/'}],
    }),
    chapter: defineLocations({
      select: {
        title: 'title',
        number: 'number',
      },
      resolve: (doc) => ({
        locations: [
          {
            title:
              doc?.number != null
                ? `Chapter ${doc.number}: ${doc?.title || 'Untitled'}`
                : doc?.title || 'Chapter',
            href: '/contents',
          },
        ],
      }),
    }),
    topic: defineLocations({
      select: {
        name: 'name',
        symbol: 'symbol',
        slug: 'slug.current',
      },
      resolve: (doc) => ({
        locations: [
          ...(doc?.slug
            ? [
                {
                  title: doc.symbol
                    ? `[ ${doc.symbol} ] ${doc.name || ''} (Contents)`
                    : 'Topic (Contents)',
                  href: `/contents?topic=${encodeURIComponent(doc.slug)}`,
                },
                {
                  title: doc.symbol
                    ? `[ ${doc.symbol} ] ${doc.name || ''} (Home)`
                    : 'Topic (Home)',
                  href: `/?topic=${encodeURIComponent(doc.slug)}`,
                },
              ]
            : [
                {
                  title: 'Master Table of Contents',
                  href: '/contents',
                },
              ]),
        ],
      }),
    }),
    article: defineLocations({
      select: {
        title: 'title',
        slug: 'slug.current',
      },
      resolve: (doc) => ({
        locations: [
          ...(doc?.slug
            ? [
                {
                  title: doc?.title || 'Untitled Article',
                  href: `/${doc.slug}`,
                },
                {
                  title: 'Version History & Diffs',
                  href: `/${doc.slug}/versions`,
                },
              ]
            : []),
          {
            title: 'Master Table of Contents',
            href: '/contents',
          },
          {
            title: 'Home Page',
            href: '/',
          },
        ],
      }),
    }),
    articleVersion: defineLocations({
      select: {
        title: 'snapshotTitle',
        version: 'versionNumber',
        slug: 'article.slug.current',
      },
      resolve: (doc) => ({
        locations: [
          ...(doc?.slug && doc?.version != null
            ? [
                {
                  title: `Edition v${doc.version}: ${doc.title || 'Treatise'}`,
                  href: `/${doc.slug}/v${doc.version}`,
                },
                {
                  title: 'Version History & Diffs',
                  href: `/${doc.slug}/versions`,
                },
                {
                  title: `${doc.title || 'Treatise'} (Live Active Edition)`,
                  href: `/${doc.slug}`,
                },
              ]
            : []),
        ],
      }),
    }),
  },
}
