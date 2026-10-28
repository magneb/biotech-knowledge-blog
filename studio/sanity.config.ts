import {defineConfig} from 'sanity'
import {presentationTool} from 'sanity/presentation'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {resolve} from './src/presentation/resolve'
import {structure, defaultDocumentNode} from './src/structure'
import {createPublishWithSnapshotAction} from './src/actions/publishWithSnapshot'

const studioEnv = (
  globalThis as {process?: {env?: Record<string, string | undefined>}}
).process?.env

const previewOrigin =
  studioEnv?.SANITY_STUDIO_PREVIEW_ORIGIN || 'http://localhost:3000'

export default defineConfig({
  name: 'default',
  title: 'Olivers Guide To Everything',

  projectId: '9bx84ykf',
  dataset: 'production',

  plugins: [
    structureTool({structure, defaultDocumentNode}),
    presentationTool({
      resolve,
      previewUrl: {
        origin: previewOrigin,
        previewMode: {
          enable: '/api/draft-mode/enable',
          disable: '/api/draft-mode/disable',
        },
      },
    }),
    visionTool(),
  ],

  document: {
    actions: (prev, context) => {
      if (context.schemaType === 'article') {
        const withCustomPublish = prev.map((originalAction) =>
          originalAction.action === 'publish'
            ? createPublishWithSnapshotAction(originalAction)
            : originalAction
        )
        return withCustomPublish
      }
      return prev
    },
  },

  schema: {
    types: schemaTypes,
  },
})
