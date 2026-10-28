import {CogIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings & Operations',
  type: 'document',
  icon: CogIcon,
  groups: [
    {name: 'operations', title: 'Operations & Status', default: true},
    {name: 'cache', title: 'Cache Control'},
    {name: 'metadata', title: 'Global Publication Metadata'},
  ],
  fields: [
    // ─── Group: operations ───
    defineField({
      name: 'maintenanceMode',
      title: 'Maintenance Mode (Worker 503 Killswitch)',
      type: 'boolean',
      group: 'operations',
      initialValue: false,
      description:
        'Emergency brake. When enabled, the outer Cloudflare Worker immediately returns HTTP 503 to public visitors with a Victorian maintenance folio before edge cache or Next.js runs.',
    }),
    defineField({
      name: 'maintenanceTitle',
      title: 'Maintenance Notice Title',
      type: 'string',
      group: 'operations',
      initialValue: 'Undergoing Scholarly Revision',
      description: 'Heading displayed on the public Victorian 503 folio.',
    }),
    defineField({
      name: 'maintenanceMessage',
      title: 'Maintenance Notice Message',
      type: 'text',
      rows: 3,
      group: 'operations',
      initialValue:
        'The compendium is temporarily closed for cataloguing, binding, and archival preservation. Please return shortly.',
      description: 'Explanatory copy displayed on the public Victorian 503 folio.',
    }),
    defineField({
      name: 'wipBannerEnabled',
      title: 'Work-in-Progress Top Banner',
      type: 'boolean',
      group: 'operations',
      initialValue: true,
      description:
        'Displays a high-visibility Victorian notice bar across the top of all public pages.',
    }),
    defineField({
      name: 'wipBannerText',
      title: 'WIP Banner Text',
      type: 'string',
      group: 'operations',
      initialValue:
        "Work in Progress — Oliver's Guide is actively being penned and curated. Protocols may undergo revision.",
      description:
        'Notice text. Updating this text automatically un-dismisses the banner for visitors who dismissed prior notices.',
    }),

    // ─── Group: cache ───
    defineField({
      name: 'cachePurgeNotice',
      title: 'Cache Purge Operations',
      type: 'string',
      group: 'cache',
      readOnly: true,
      initialValue:
        'To purge edge KV, D1 tags, and browser caches site-wide, run "npm run cache:purge" or POST to /api/revalidate with {"purgeAll": true}.',
      description:
        'Cache invalidation instructions. Publishing siteSettings automatically invalidates site-wide layout and frontispiece caches.',
    }),

    // ─── Group: metadata ───
    defineField({
      name: 'siteTitle',
      title: 'Compendium / Site Title',
      type: 'string',
      group: 'metadata',
      initialValue: "Oliver's Guide To Everything",
      description: 'Global publication title used in headers, Dublin Core, and citations.',
    }),
    defineField({
      name: 'authorName',
      title: 'Lead Author / Creator Name',
      type: 'string',
      group: 'metadata',
      initialValue: 'Oliver',
      description:
        'Author name used in Dublin Core (DC.creator), Google Scholar, APA citations, and print styles.',
    }),
    defineField({
      name: 'authorAffiliation',
      title: 'Author Affiliation / Laboratory',
      type: 'string',
      group: 'metadata',
      initialValue: 'Cancer Biology & Molecular Biotechnology',
      description: 'Academic laboratory or institutional affiliation for scholarly metadata.',
    }),
    defineField({
      name: 'publisher',
      title: 'Publisher Entity',
      type: 'string',
      group: 'metadata',
      initialValue: "Oliver's Guide To Everything",
      description: 'Publisher name used in Dublin Core (DC.publisher) and academic indexes.',
    }),
    defineField({
      name: 'siteDescription',
      title: 'Publication Description',
      type: 'text',
      rows: 2,
      group: 'metadata',
      initialValue: 'A personal knowledge base for biotech and cancer research protocols.',
      description: 'Default publication summary for Dublin Core and search engine indexing.',
    }),
    defineField({
      name: 'canonicalDomain',
      title: 'Canonical Domain / Base URL',
      type: 'url',
      group: 'metadata',
      initialValue: 'https://oliversguidetoeverything.com',
      description: 'Base URL for persistent edition permalinks.',
      validation: (rule) =>
        rule.uri({
          scheme: ['http', 'https'],
        }),
    }),
    defineField({
      name: 'contactEmail',
      title: 'Contact / Inquiry Email',
      type: 'string',
      group: 'metadata',
      description: 'Contact email rendered in footer and publication metadata.',
      validation: (rule) => rule.email(),
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Site Settings & Operations',
        subtitle: 'Unified operational switches, cache controls, and scholarly metadata',
      }
    },
  },
})
