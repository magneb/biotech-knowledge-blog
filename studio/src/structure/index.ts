import {ArchiveIcon} from '@sanity/icons/Archive'
import {BookIcon} from '@sanity/icons/Book'
import {CogIcon} from '@sanity/icons/Cog'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {HomeIcon} from '@sanity/icons/Home'
import {TagIcon} from '@sanity/icons/Tag'
import {UserIcon} from '@sanity/icons/User'
import type {DefaultDocumentNodeResolver, StructureResolver} from 'sanity/structure'
import {ArticleHistoryView} from '../components/ArticleHistoryView'

const SINGLETONS = ['siteSettings', 'homePage', 'aboutPage']
const MANAGED_DOCUMENT_TYPES = [
  ...SINGLETONS,
  'chapter',
  'article',
  'articleVersion',
  'topic',
]

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (schemaType === 'article') {
    return S.document().views([
      S.view.form().title('Edit Protocol'),
      S.view
        .component(ArticleHistoryView)
        .title('Version History & Snapshots')
        .icon(ArchiveIcon),
    ])
  }
  return S.document().views([S.view.form()])
}

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // 1. Site Settings & Operations (Singleton #1)
      S.listItem()
        .title('Site Settings & Operations')
        .icon(CogIcon)
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Site Settings & Operations'),
        ),

      // 2. Home Page (Singleton)
      S.listItem()
        .title('Home Page')
        .icon(HomeIcon)
        .child(S.document().schemaType('homePage').documentId('homePage').title('Home Page')),

      // 3. About & Metadata Settings (Singleton)
      S.listItem()
        .title('About & Metadata Settings')
        .icon(UserIcon)
        .child(
          S.document()
            .schemaType('aboutPage')
            .documentId('aboutPage')
            .title('About & Metadata Settings'),
        ),

      S.divider(),

      // 3. Chapters & Content
      S.listItem()
        .title('Chapters & Content')
        .icon(BookIcon)
        .child(
          S.list()
            .title('Chapters & Content')
            .items([
              S.documentTypeListItem('chapter').title('Chapters').icon(BookIcon),
              S.documentTypeListItem('article')
                .title('All Articles, Guides & Protocols')
                .icon(DocumentTextIcon),
              S.documentTypeListItem('articleVersion')
                .title('Archival Edition Snapshots')
                .icon(ArchiveIcon),
              S.divider(),
              S.listItem()
                .title('Articles by Chapter')
                .icon(BookIcon)
                .child(
                  S.documentTypeList('chapter')
                    .title('Select a Chapter')
                    .defaultOrdering([{field: 'number', direction: 'asc'}])
                    .child((chapterId) =>
                      S.documentList()
                        .title('Chapter Entries')
                        .schemaType('article')
                        .filter('_type == "article" && chapter._ref == $chapterId')
                        .params({chapterId})
                        .defaultOrdering([
                          {field: 'chapterOrder', direction: 'asc'},
                          {field: 'publishedAt', direction: 'desc'},
                        ]),
                    ),
                ),
            ]),
        ),

      // 4. Topics / Taxonomies
      S.listItem()
        .title('Topics / Taxonomies')
        .icon(TagIcon)
        .child(
          S.list()
            .title('Topics / Taxonomies')
            .items([
              S.documentTypeListItem('topic')
                .title('Topics & Elemental Tags')
                .icon(TagIcon),
            ]),
        ),

      // Any remaining ungrouped document types (excluding singletons and managed types)
      ...S.documentTypeListItems().filter(
        (listItem) => !MANAGED_DOCUMENT_TYPES.includes(listItem.getId() as string),
      ),

      // <bibliography-slot>
      // Placeholder for WP-9: Per-article / on-the-fly Bibliography & Citations integration
      // </bibliography-slot>
    ])
