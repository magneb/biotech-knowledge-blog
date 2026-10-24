import {HomeIcon} from '@sanity/icons/Home'
import {PlayIcon} from '@sanity/icons/Play'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const homePage = defineType({
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'logo',
      title: 'Logo / Emblem',
      type: 'image',
      description: 'The main emblem displayed at the center of the landing page',
      options: {hotspot: true},
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subheading',
      title: 'Subheading',
      type: 'string',
    }),
    defineField({
      name: 'intro',
      title: 'Introduction',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({
      name: 'featuredArticles',
      title: 'Featured Articles',
      type: 'array',
      description: 'Curated articles, guides, or protocols highlighted on the landing page.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'article'}],
        }),
      ],
      validation: (rule) => rule.max(4).unique(),
    }),
    defineField({
      name: 'mottoBanner',
      title: 'Motto Banner Copy',
      type: 'string',
      description: 'Mid-page decorative motto text (e.g., "Knowledge for a More Curious World").',
      initialValue: 'Knowledge for a More Curious World',
    }),
    defineField({
      name: 'mediaChannels',
      title: 'Media Channels',
      type: 'array',
      description:
        'External links to YouTube, TikTok, and LinkedIn (links only — no direct video files).',
      of: [
        defineArrayMember({
          name: 'mediaChannel',
          title: 'Media Channel',
          type: 'object',
          icon: PlayIcon,
          fields: [
            defineField({
              name: 'platform',
              title: 'Platform',
              type: 'string',
              options: {
                list: [
                  {title: 'YouTube', value: 'youtube'},
                  {title: 'TikTok', value: 'tiktok'},
                  {title: 'LinkedIn', value: 'linkedin'},
                  {title: 'Other', value: 'other'},
                ],
              },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'string',
            }),
            defineField({
              name: 'url',
              title: 'Channel / Profile URL',
              type: 'url',
              validation: (rule) =>
                rule.required().uri({
                  scheme: ['http', 'https'],
                }),
            }),
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'platform',
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'string',
      description:
        'Used by the "Contact" link in the site footer. Leave empty to hide the link.',
      validation: (rule) => rule.email(),
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Home Page'}
    },
  },
})
