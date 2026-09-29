import type {StructureResolver} from 'sanity/structure'

const SINGLETONS = ['homePage']

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // Singletons
      S.listItem()
        .title('Home Page')
        .child(S.document().schemaType('homePage').documentId('homePage').title('Home Page')),

      S.divider(),

      // Content lists (filtered to exclude singletons)
      ...S.documentTypeListItems().filter(
        (listItem) => !SINGLETONS.includes(listItem.getId() as string),
      ),
    ])
