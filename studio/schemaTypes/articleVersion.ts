import {ArchiveIcon} from '@sanity/icons/Archive'
import {defineField, defineType} from 'sanity'
import {scholarlyPortableTextMembers} from './shared/scholarlyPortableText'

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
      description: 'Summary of scientific changes for this edition.',
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
      of: scholarlyPortableTextMembers,
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
