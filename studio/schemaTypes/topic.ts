import {TagIcon} from '@sanity/icons/Tag'
import {defineField, defineType} from 'sanity'

export const topic = defineType({
  name: 'topic',
  title: 'Topic',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'symbol',
      title: 'Elemental Symbol',
      type: 'string',
      description: '2-letter elemental abbreviation for periodic badges (e.g., Ca, Pr, Cr).',
      validation: (rule) => rule.required().min(1).max(3),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      symbol: 'symbol',
      description: 'description',
    },
    prepare({title, symbol, description}) {
      return {
        title: symbol ? `[ ${symbol} ] ${title}` : title,
        subtitle: description,
      }
    },
  },
})
