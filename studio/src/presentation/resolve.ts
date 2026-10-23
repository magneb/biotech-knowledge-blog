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
      route: '/:slug',
      filter: `_type == "article" && slug.current == $slug`,
    },
  ]),
  locations: {
    homePage: defineLocations({
      locations: [{title: 'Home Page', href: '/'}],
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
              ]
            : []),
          {
            title: 'Home Page',
            href: '/',
          },
        ],
      }),
    }),
  },
}
