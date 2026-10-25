import {UserIcon} from '@sanity/icons/User'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About & Author Settings',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'About Page Title',
      type: 'string',
      initialValue: "About Oliver's Guide & Laboratory",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'authorName',
      title: 'Lead Author / Creator Name',
      type: 'string',
      description:
        'Author name used in Dublin Core (DC.creator), Google Scholar, and APA citations (e.g. "Oliver").',
    }),
    defineField({
      name: 'authorAffiliation',
      title: 'Author Affiliation / Laboratory',
      type: 'string',
      description:
        'Academic laboratory or institutional affiliation for scholarly metadata.',
    }),
    defineField({
      name: 'bio',
      title: 'Biography / Compendium Statement',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({
      name: 'portraitEtching',
      title: 'Portrait / Etching Illustration',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'siteTitle',
      title: 'Compendium / Site Title',
      type: 'string',
      description:
        'Global publication title for metadata, citations, and headers (default: "Oliver\'s Guide To Everything").',
    }),
    defineField({
      name: 'publisher',
      title: 'Publisher Entity',
      type: 'string',
      description:
        'Publisher name used in Dublin Core (DC.publisher) and academic indexes.',
    }),
    defineField({
      name: 'siteDescription',
      title: 'Publication Description',
      type: 'text',
      rows: 2,
      description:
        'Default publication summary used in Dublin Core metadata and search engine descriptions.',
    }),
    defineField({
      name: 'canonicalDomain',
      title: 'Canonical Domain / Base URL',
      type: 'url',
      description:
        'Base URL for persistent edition permalinks (e.g. "https://oliversguidetoeverything.com").',
      validation: (rule) =>
        rule.uri({
          scheme: ['http', 'https'],
        }),
    }),
    defineField({
      name: 'contactEmail',
      title: 'Contact / Inquiry Email',
      type: 'string',
      validation: (rule) => rule.email(),
    }),
  ],
  preview: {
    prepare() {
      return {title: 'About & Author Settings'}
    },
  },
})
