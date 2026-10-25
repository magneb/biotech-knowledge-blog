import {BottleIcon} from '@sanity/icons/Bottle'
import {DocumentPdfIcon} from '@sanity/icons/DocumentPdf'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {HighlightIcon} from '@sanity/icons/Highlight'
import {ImageIcon} from '@sanity/icons/Image'
import {LinkIcon} from '@sanity/icons/Link'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  icon: DocumentTextIcon,
  groups: [
    {name: 'content', title: 'Content & Media', default: true},
    {name: 'taxonomy', title: 'Chapter & Topics'},
  ],
  fields: [
    defineField({
      name: 'isNewEdition',
      title: 'Publish as New Official Edition',
      type: 'boolean',
      group: 'content',
      description:
        'Toggle ON only when publishing substantive scientific revisions that require a new immutable edition tag.',
      initialValue: false,
    }),
    defineField({
      name: 'versionChangelog',
      title: 'Edition Changelog Notes',
      type: 'text',
      group: 'content',
      rows: 3,
      description:
        'Summarize the scientific changes for this edition. Required when publishing a new official edition.',
      hidden: ({document}) => !document?.isNewEdition,
      validation: (rule) =>
        rule.custom((value, context) => {
          if (
            context.document?.isNewEdition &&
            (!value || typeof value !== 'string' || !value.trim())
          ) {
            return 'Changelog notes are required when publishing a new official edition.'
          }
          return true
        }),
    }),
    defineField({
      name: 'versionNumber',
      title: 'Current Edition',
      type: 'number',
      group: 'content',
      readOnly: true,
      initialValue: 1,
      description:
        'Official edition number (automatically incremented upon publishing a new edition).',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Last Published At',
      type: 'datetime',
      group: 'content',
      readOnly: true,
      initialValue: () => new Date().toISOString(),
      description: 'Timestamp of the latest published edition.',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'contentType',
      title: 'Content Type',
      type: 'string',
      group: 'content',
      initialValue: 'article',
      options: {
        list: [
          {title: 'Article', value: 'article'},
          {title: 'Guide', value: 'guide'},
          {title: 'Protocol', value: 'protocol'},
          {title: 'Research Note', value: 'research-note'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      group: 'content',
      rows: 3,
    }),
    defineField({
      name: 'chapter',
      title: 'Chapter',
      type: 'reference',
      group: 'taxonomy',
      to: [{type: 'chapter'}],
      description: 'Book chapter this entry belongs to (entries can be published out of order).',
    }),
    defineField({
      name: 'chapterOrder',
      title: 'Order Within Chapter',
      type: 'number',
      group: 'taxonomy',
      description: 'Numeric reading order inside the selected chapter (e.g., 1, 2, 3).',
      validation: (rule) => rule.integer().positive(),
    }),
    defineField({
      name: 'topics',
      title: 'Topics',
      type: 'array',
      group: 'taxonomy',
      description: 'Elemental taxonomy tags associated with this entry.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'topic'}],
        }),
      ],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'featured',
      title: 'Featured Showcase',
      type: 'boolean',
      group: 'taxonomy',
      description: 'Highlight this entry in the landing page showcase.',
      initialValue: false,
    }),
    defineField({
      name: 'coverEtching',
      title: 'Cover Etching',
      type: 'image',
      group: 'content',
      description: 'Primary copperplate illustration displayed on cards and the article header.',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative Text',
          type: 'string',
        }),
        defineField({
          name: 'caption',
          title: 'Caption',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'downloadablePdfs',
      title: 'Downloadable PDFs',
      type: 'array',
      group: 'content',
      description: 'Protocol summaries, bench worksheets, or reference PDFs.',
      of: [
        defineArrayMember({
          name: 'pdfAttachment',
          title: 'PDF Attachment',
          type: 'object',
          icon: DocumentPdfIcon,
          fields: [
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
              name: 'file',
              title: 'PDF File',
              type: 'file',
              options: {accept: 'application/pdf'},
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'description',
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'block',
          marks: {
            annotations: [
              defineArrayMember({
                name: 'link',
                title: 'External Link',
                type: 'object',
                icon: LinkIcon,
                fields: [
                  defineField({
                    name: 'href',
                    title: 'URL',
                    type: 'url',
                    validation: (rule) =>
                      rule.required().uri({
                        allowRelative: true,
                        scheme: ['http', 'https', 'mailto'],
                      }),
                  }),
                ],
              }),
              defineArrayMember({
                name: 'internalLink',
                title: 'Internal Treatise Reference',
                type: 'object',
                icon: DocumentTextIcon,
                fields: [
                  defineField({
                    name: 'linkType',
                    title: 'Reference Status',
                    type: 'string',
                    initialValue: 'resolved',
                    options: {
                      list: [
                        {title: 'Existing Treatise, Chapter or Topic', value: 'resolved'},
                        {title: 'Planned Treatise (Treatise in Preparation)', value: 'planned'},
                      ],
                      layout: 'radio',
                    },
                    validation: (rule) => rule.required(),
                  }),
                  defineField({
                    name: 'reference',
                    title: 'Referenced Document',
                    type: 'reference',
                    to: [{type: 'article'}, {type: 'chapter'}, {type: 'topic'}],
                    hidden: ({parent}) => parent?.linkType !== 'resolved',
                  }),
                  defineField({
                    name: 'plannedTitle',
                    title: 'Planned Treatise Title',
                    type: 'string',
                    description: 'e.g. "Differential Centrifugation Protocol"',
                    hidden: ({parent}) => parent?.linkType !== 'planned',
                  }),
                  defineField({
                    name: 'plannedNote',
                    title: 'Preparation Note',
                    type: 'string',
                    description: 'e.g. "Planned for Chapter III: Reagents & Separation"',
                    hidden: ({parent}) => parent?.linkType !== 'planned',
                  }),
                ],
              }),
              defineArrayMember({
                name: 'annotatedTerm',
                title: 'Annotated Scientific Term',
                type: 'object',
                icon: HighlightIcon,
                fields: [
                  defineField({
                    name: 'definition',
                    title: 'Definition / Margin Note',
                    type: 'text',
                    rows: 2,
                    validation: (rule) => rule.required(),
                  }),
                  defineField({
                    name: 'symbol',
                    title: 'Abbreviation / Formula',
                    type: 'string',
                  }),
                ],
              }),
            ],
          },
        }),
        defineArrayMember({
          name: 'figureCallout',
          title: 'Scientific Figure',
          type: 'object',
          icon: ImageIcon,
          fields: [
            defineField({
              name: 'figureNumber',
              title: 'Figure Label',
              type: 'string',
              description: 'e.g., Fig. 1.1 or Plate IV',
            }),
            defineField({
              name: 'image',
              title: 'Illustration / Etching',
              type: 'image',
              options: {hotspot: true},
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'alt',
              title: 'Alternative Text',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'caption',
              title: 'Figure Caption',
              type: 'text',
              rows: 2,
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'credit',
              title: 'Source / Attribution',
              type: 'string',
            }),
          ],
          preview: {
            select: {
              title: 'figureNumber',
              subtitle: 'caption',
              media: 'image',
            },
            prepare({title, subtitle, media}) {
              return {
                title: title || 'Scientific Figure',
                subtitle,
                media,
              }
            },
          },
        }),
        defineArrayMember({
          name: 'formulaReagents',
          title: 'Formula / Reagents Box',
          type: 'object',
          icon: BottleIcon,
          fields: [
            defineField({
              name: 'title',
              title: 'Heading',
              type: 'string',
              initialValue: 'Reagents & Apparatus',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'formulaNote',
              title: 'Formula / Preparation Note',
              type: 'text',
              rows: 2,
            }),
            defineField({
              name: 'items',
              title: 'Reagents / Components',
              type: 'array',
              of: [
                defineArrayMember({
                  name: 'reagentItem',
                  title: 'Reagent / Component',
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'name',
                      title: 'Reagent / Component Name',
                      type: 'string',
                      validation: (rule) => rule.required(),
                    }),
                    defineField({
                      name: 'quantity',
                      title: 'Quantity / Concentration',
                      type: 'string',
                    }),
                    defineField({
                      name: 'note',
                      title: 'Grade / Preparation Note',
                      type: 'string',
                    }),
                  ],
                  preview: {
                    select: {
                      title: 'name',
                      subtitle: 'quantity',
                    },
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'formulaNote',
            },
            prepare({title, subtitle}) {
              return {
                title: title || 'Formula / Reagents',
                subtitle,
              }
            },
          },
        }),
      ],
    }),
  ],
  orderings: [
    {
      title: 'Chapter Order (Asc)',
      name: 'chapterOrderAsc',
      by: [
        {field: 'chapterOrder', direction: 'asc'},
        {field: 'publishedAt', direction: 'desc'},
      ],
    },
    {
      title: 'Published Date (Newest)',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'contentType',
      media: 'coverEtching',
    },
  },
})
