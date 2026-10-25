import {useState} from 'react'
import {useClient} from 'sanity'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'

export function createPublishWithSnapshotAction(
  originalPublishAction: DocumentActionComponent
): DocumentActionComponent {
  const PublishWithSnapshotAction: DocumentActionComponent = (
    props: DocumentActionProps
  ) => {
    const originalResult = originalPublishAction(props)
    const {id, type, draft, published} = props
    const [isPublishing, setIsPublishing] = useState(false)
    const client = useClient({apiVersion: '2026-09-29'})

    if (type !== 'article') {
      return originalResult
    }

    if (!originalResult) {
      return null
    }

    const isNewEdition = Boolean(draft?.isNewEdition)
    const changelog =
      typeof draft?.versionChangelog === 'string'
        ? draft.versionChangelog.trim()
        : ''

    const missingChangelog = isNewEdition && !changelog

    return {
      ...originalResult,
      label: isPublishing
        ? 'Recording Edition...'
        : isNewEdition
          ? 'Publish as New Edition'
          : originalResult.label,
      disabled: Boolean(originalResult.disabled || isPublishing || missingChangelog),
      title: missingChangelog
        ? 'Please enter changelog notes before publishing a new edition'
        : isNewEdition
          ? 'Publishes draft and archives an immutable official edition snapshot'
          : originalResult.title,
      onHandle: async () => {
        if (!draft && !published) return

        if (isNewEdition && draft) {
          if (!changelog) {
            return
          }

          setIsPublishing(true)
          try {
            const now = new Date().toISOString()
            const articleId = id.replace(/^drafts\./, '')
            const currentPublishedVersion =
              (published?.versionNumber as number) ||
              (draft.versionNumber as number) ||
              1
            const nextVersion = currentPublishedVersion + 1

            // 1. If published document exists and doesn't have a snapshot for currentPublishedVersion, record baseline
            if (published) {
              const existingSnapshot = await client.fetch(
                `*[_type == "articleVersion" && article._ref == $articleId && versionNumber == $v][0]._id`,
                {articleId, v: currentPublishedVersion}
              )
              if (!existingSnapshot) {
                await client.create({
                  _type: 'articleVersion',
                  article: {_type: 'reference', _ref: articleId},
                  versionNumber: currentPublishedVersion,
                  publishedAt:
                    (published.publishedAt as string) ||
                    (published._createdAt as string) ||
                    now,
                  changeSummary:
                    (published.versionChangelog as string) ||
                    `Edition v${currentPublishedVersion} archival baseline snapshot.`,
                  snapshotTitle: (published.title as string) || 'Untitled Protocol',
                  snapshotContentType:
                    (published.contentType as string) || 'protocol',
                  snapshotSummary: (published.summary as string) || '',
                  snapshotCoverEtching: published.coverEtching || null,
                  snapshotBody: published.body || [],
                })
              }
            }

            // 2. Snapshot the new edition (nextVersion) with draft's content and changelog
            await client.create({
              _type: 'articleVersion',
              article: {_type: 'reference', _ref: articleId},
              versionNumber: nextVersion,
              publishedAt: now,
              changeSummary: changelog,
              snapshotTitle:
                (draft.title as string) ||
                (published?.title as string) ||
                'Untitled Protocol',
              snapshotContentType:
                (draft.contentType as string) ||
                (published?.contentType as string) ||
                'protocol',
              snapshotSummary: (draft.summary as string) || '',
              snapshotCoverEtching:
                draft.coverEtching || published?.coverEtching || null,
              snapshotBody: draft.body || published?.body || [],
            })

            // 3. Patch the draft so the published document receives nextVersion,
            // resets isNewEdition to false, clears versionChangelog, and updates publishedAt.
            await client
              .patch(`drafts.${articleId}`)
              .set({
                versionNumber: nextVersion,
                isNewEdition: false,
                versionChangelog: '',
                publishedAt: now,
              })
              .commit()

            // 4. Invoke native publish action to complete publishing
            if (originalResult.onHandle) {
              await originalResult.onHandle()
            }
          } catch (err) {
            console.error('Failed to publish with snapshot:', err)
          } finally {
            setIsPublishing(false)
          }
        } else {
          // Normal publish (minor editorial fix without incrementing edition)
          if (originalResult.onHandle) {
            await originalResult.onHandle()
          }
        }
      },
    }
  }

  PublishWithSnapshotAction.action = 'publish'
  return PublishWithSnapshotAction
}
