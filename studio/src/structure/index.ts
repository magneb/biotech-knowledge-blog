import {BookIcon} from '@sanity/icons/Book'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {HomeIcon} from '@sanity/icons/Home'
import {TagIcon} from '@sanity/icons/Tag'
import type {StructureResolver} from 'sanity/structure'

const SINGLETONS = ['homePage']
const MANAGED_DOCUMENT_TYPES = [...SINGLETONS, 'chapter', 'article', 'topic']

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // 1. Home Page (Singleton)
      S.listItem()
        .title('Home Page')
        .icon(HomeIcon)
        .child(S.document().schemaType('homePage').documentId('homePage').title('Home Page')),

      S.divider(),

      // 2. Chapters & Content
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

      // 3. Topics / Taxonomies
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
