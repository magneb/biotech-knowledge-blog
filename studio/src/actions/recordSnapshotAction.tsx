import {useState} from 'react'
import {useClient} from 'sanity'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'
import {ArchiveIcon} from '@sanity/icons/Archive'
import {Button, Card, Flex, Stack, Text, TextArea, Badge} from '@sanity/ui'

export const RecordVersionSnapshotAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const {id, type, published, draft, onComplete} = props
  const [dialogOpen, setDialogOpen] = useState(false)
  const [changelog, setChangelog] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const client = useClient({apiVersion: '2026-09-29'})

  // Only apply to article documents
  if (type !== 'article') return null

  const currentDoc = draft || published
  const currentVersion = (currentDoc?.versionNumber as number) || 1
  const nextVersion = currentVersion + 1

  const handleCreateSnapshot = async () => {
    if (!currentDoc) return
    setIsSubmitting(true)
    setError(null)

    try {
      const now = new Date().toISOString()
      const cleanChangelog = changelog.trim() || 'Substantive scientific protocol revision.'

      // 1. Create permanent immutable articleVersion snapshot in Sanity Content Lake
      await client.create({
        _type: 'articleVersion',
        article: {
          _type: 'reference',
          _ref: id.replace(/^drafts\./, ''),
        },
        versionNumber: nextVersion,
        publishedAt: now,
        changeSummary: cleanChangelog,
        snapshotTitle: (currentDoc.title as string) || 'Untitled Protocol',
        snapshotContentType: (currentDoc.contentType as string) || 'protocol',
        snapshotSummary: (currentDoc.summary as string) || '',
        snapshotCoverEtching: currentDoc.coverEtching || null,
        snapshotBody: currentDoc.body || [],
      })

      // 2. Bump versionNumber on the parent article and record changelog
      const articleId = id.replace(/^drafts\./, '')
      await client
        .patch(articleId)
        .set({
          versionNumber: nextVersion,
          versionChangelog: cleanChangelog,
          isNewEdition: false,
          publishedAt: now,
        })
        .commit()

      // If draft exists, also patch the draft
      if (draft) {
        await client
          .patch(`drafts.${articleId}`)
          .set({
            versionNumber: nextVersion,
            versionChangelog: cleanChangelog,
            isNewEdition: false,
            publishedAt: now,
          })
          .commit()
      }

      setDialogOpen(false)
      setChangelog('')
      if (onComplete) onComplete()
    } catch (err) {
      console.error('Failed to create archival edition snapshot:', err)
      setError(err instanceof Error ? err.message : 'Failed to record snapshot.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    label: `Record Snapshot (v${nextVersion})`,
    icon: ArchiveIcon,
    title: `Freeze current state into an immutable archival snapshot (v${nextVersion}) and bump the edition counter`,
    onHandle: () => {
      setDialogOpen(true)
    },
    dialog: dialogOpen
      ? {
          type: 'dialog',
          onClose: () => {
            if (!isSubmitting) setDialogOpen(false)
          },
          header: 'Record Archival Protocol Edition',
          content: (
            <Card padding={4}>
              <Stack gap={4}>
                <Card tone="primary" padding={3} radius={2}>
                  <Stack gap={2}>
                    <Flex align="center" gap={2}>
                      <Badge tone="positive" fontSize={1} padding={2}>
                        Current: Edition v{currentVersion}
                      </Badge>
                      <Text size={1} weight="semibold">
                        &rarr;
                      </Text>
                      <Badge tone="caution" fontSize={1} padding={2}>
                        New: Edition v{nextVersion}
                      </Badge>
                    </Flex>
                    <Text size={1} muted>
                      Freezes an immutable copy of title, summary, cover etching, and rich
                      text blocks into Sanity Content Lake. Permanent wet-lab permalink:
                      <strong> /{currentDoc?.slug ? (currentDoc.slug as {current?: string}).current || 'slug' : 'slug'}/v{nextVersion}/</strong>.
                    </Text>
                  </Stack>
                </Card>

                <Stack gap={2}>
                  <Text size={1} weight="semibold">
                    Scientific Changelog Notes
                  </Text>
                  <Text size={1} muted>
                    Summarize substantive changes (e.g. updated reagent concentrations, incubation temperatures, or revised control steps):
                  </Text>
                  <TextArea
                    value={changelog}
                    onChange={(e) => setChangelog(e.currentTarget.value)}
                    placeholder="e.g., Increased annealing temperature to 58°C and incorporated DMSO control step."
                    rows={4}
                    disabled={isSubmitting}
                  />
                </Stack>

                {error && (
                  <Card tone="critical" padding={3} radius={2}>
                    <Text size={1}>{error}</Text>
                  </Card>
                )}
              </Stack>
            </Card>
          ),
          footer: (
            <Flex justify="flex-end" gap={2} padding={3}>
              <Button
                mode="ghost"
                text="Cancel"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
              />
              <Button
                tone="positive"
                text={isSubmitting ? 'Recording Snapshot...' : `Record Edition v${nextVersion} Snapshot`}
                icon={ArchiveIcon}
                onClick={handleCreateSnapshot}
                disabled={isSubmitting}
              />
            </Flex>
          ),
        }
      : null,
  }
}
