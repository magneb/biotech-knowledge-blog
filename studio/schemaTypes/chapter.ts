import {BookIcon} from '@sanity/icons/Book'
import {defineField, defineType} from 'sanity'

export const chapter = defineType({
  name: 'chapter',
  title: 'Chapter',
  type: 'document',
  icon: BookIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'number',
      title: 'Chapter Number',
      type: 'number',
      description: 'Numeric sequence order in the book Table of Contents (e.g., 1, 2, 3).',
      validation: (rule) => rule.required().integer().positive(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
      description: 'Brief 2–3 line synopsis of the chapter scope.',
    }),
    defineField({
      name: 'vignette',
      title: 'Chapter Vignette (Etching)',
      type: 'image',
      description: 'Copperplate etching illustration representing this chapter.',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative Text',
          type: 'string',
        }),
      ],
    }),
  ],
  orderings: [
    {
      title: 'Chapter Number (Asc)',
      name: 'numberAsc',
      by: [{field: 'number', direction: 'asc'}],
    },
    {
      title: 'Chapter Number (Desc)',
      name: 'numberDesc',
      by: [{field: 'number', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      number: 'number',
      media: 'vignette',
    },
    prepare({title, number, media}) {
      return {
        title: number !== undefined ? `Chapter ${number}: ${title}` : title,
        media,
      }
    },
  },
})
