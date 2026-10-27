import {BottleIcon} from '@sanity/icons/Bottle'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {HighlightIcon} from '@sanity/icons/Highlight'
import {ImageIcon} from '@sanity/icons/Image'
import {LinkIcon} from '@sanity/icons/Link'
import {defineArrayMember, defineField} from 'sanity'

/**
 * Shared Portable Text block, mark, and callout definitions for scholarly articles
 * and historical version snapshots.
 */
export const scholarlyPortableTextMembers = [
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
]
