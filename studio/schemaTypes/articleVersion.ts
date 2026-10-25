import {ArchiveIcon} from '@sanity/icons/Archive'
import {BottleIcon} from '@sanity/icons/Bottle'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {HighlightIcon} from '@sanity/icons/Highlight'
import {ImageIcon} from '@sanity/icons/Image'
import {LinkIcon} from '@sanity/icons/Link'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const articleVersion = defineType({
  name: 'articleVersion',
  title: 'Archival Edition Snapshot',
  type: 'document',
  icon: ArchiveIcon,
  fields: [
    defineField({
      name: 'article',
      title: 'Parent Treatise',
      type: 'reference',
      to: [{type: 'article'}],
      description: 'The canonical article this historical snapshot belongs to.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'versionNumber',
      title: 'Edition Number',
      type: 'number',
      description: 'The official scientific edition number frozen in this snapshot (e.g. 1, 2, 3).',
      validation: (rule) => rule.required().integer().positive(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Edition Publication Date',
      type: 'datetime',
      description: 'The timestamp when this edition was officially recorded.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'changeSummary',
      title: 'Edition Changelog Notes',
      type: 'text',
      rows: 3,
      description: 'Store Norske Leksikon-style summary of scientific changes for this edition.',
    }),
    defineField({
      name: 'snapshotTitle',
      title: 'Snapshot Title',
      type: 'string',
      description: 'Title of the treatise at the time of this edition.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'snapshotContentType',
      title: 'Snapshot Content Type',
      type: 'string',
      options: {
        list: [
          {title: 'Article', value: 'article'},
          {title: 'Guide', value: 'guide'},
          {title: 'Protocol', value: 'protocol'},
          {title: 'Research Note', value: 'research-note'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'snapshotSummary',
      title: 'Snapshot Summary',
      type: 'text',
      rows: 3,
      description: 'Summary lead paragraph at the time of this edition.',
    }),
    defineField({
      name: 'snapshotCoverEtching',
      title: 'Snapshot Cover Etching',
      type: 'image',
      description: 'Illustration associated with this historical edition.',
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
      name: 'snapshotBody',
      title: 'Snapshot Body (Portable Text)',
      type: 'array',
      description: 'Frozen rich text content of this edition for historical fidelity.',
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
                    hidden: ({parent}) => parent?.linkType !== 'planned',
                  }),
                  defineField({
                    name: 'plannedNote',
                    title: 'Preparation Note',
                    type: 'string',
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
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
  orderings: [
    {
      title: 'Edition Number (Desc)',
      name: 'versionNumberDesc',
      by: [{field: 'versionNumber', direction: 'desc'}],
    },
    {
      title: 'Publication Date (Newest)',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'snapshotTitle',
      version: 'versionNumber',
      date: 'publishedAt',
      change: 'changeSummary',
    },
    prepare({title, version, date, change}) {
      const dateStr = date
        ? new Date(date).toLocaleDateString('en-US', {dateStyle: 'medium'})
        : 'Undated'
      return {
        title: `Edition v${version || 1}: ${title || 'Untitled'}`,
        subtitle: `${dateStr}${change ? ` • ${change}` : ''}`,
      }
    },
  },
})
