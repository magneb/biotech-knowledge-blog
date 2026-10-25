import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {LaunchIcon} from '@sanity/icons/Launch'
import {SyncIcon} from '@sanity/icons/Sync'
import {Badge, Button, Card, Flex, Heading, Spinner, Stack, Text} from '@sanity/ui'

interface SnapshotRecord {
  _id: string
  versionNumber: number
  publishedAt?: string
  changeSummary?: string
  snapshotTitle?: string
}

interface ArticleHistoryViewProps {
  documentId: string
  document: {
    displayed?: {
      _id?: string
      title?: string
      slug?: {current?: string}
      versionNumber?: number
      publishedAt?: string
      versionChangelog?: string
    }
  }
}

export function ArticleHistoryView({documentId, document}: ArticleHistoryViewProps) {
  const client = useClient({apiVersion: '2026-09-29'})
  const article = document.displayed
  const rawId = documentId.replace(/^drafts\./, '')
  const slug = article?.slug?.current || ''
  const currentVersion = article?.versionNumber || 1

  const [snapshots, setSnapshots] = useState<SnapshotRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchSnapshots = async () => {
    setIsLoading(true)
    try {
      const results = await client.fetch<SnapshotRecord[]>(
        `*[_type == "articleVersion" && article._ref == $rawId] | order(versionNumber desc){
          _id,
          versionNumber,
          publishedAt,
          changeSummary,
          snapshotTitle
        }`,
        {rawId},
      )
      setSnapshots(results || [])
    } catch (err) {
      console.error('Failed to load version snapshots:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSnapshots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawId])

  const webBaseUrl =
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:3000'
      : 'https://oliversguidetoeverything.com'

  return (
    <Card padding={4} tone="transparent" height="fill" overflow="auto">
      <Stack gap={4} style={{maxWidth: 820, margin: '0 auto'}}>
        {/* Masthead */}
        <Card padding={4} radius={3} tone="primary" border>
          <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
            <Stack gap={2}>
              <Flex align="center" gap={2}>
                <Heading size={2}>Store Norske Leksikon Edition Timeline</Heading>
                <Badge tone="positive" fontSize={1} padding={2}>
                  Current: v{currentVersion}
                </Badge>
              </Flex>
              <Text size={1} muted>
                Immutable historical snapshots recorded in Sanity Content Lake for treatise:{' '}
                <strong>&ldquo;{article?.title || 'Untitled'}&rdquo;</strong>
              </Text>
            </Stack>

            <Flex gap={2}>
              <Button
                mode="ghost"
                icon={SyncIcon}
                text="Refresh"
                onClick={fetchSnapshots}
                disabled={isLoading}
              />
              {slug && (
                <Button
                  tone="primary"
                  icon={LaunchIcon}
                  text="Open Diff Viewer on Web"
                  as="a"
                  href={`${webBaseUrl}/${slug}/versions`}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              )}
            </Flex>
          </Flex>
        </Card>

        {/* Loading Spinner */}
        {isLoading && (
          <Flex justify="center" align="center" padding={5}>
            <Spinner />
          </Flex>
        )}

        {/* Snapshots List */}
        {!isLoading && (
          <Stack gap={3}>
            {/* Active Living Edition Card */}
            <Card padding={3} radius={2} tone="positive" border>
              <Stack gap={2}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                  <Flex align="center" gap={2}>
                    <Badge tone="positive" fontSize={1}>
                      Edition v{currentVersion}
                    </Badge>
                    <Text size={1} weight="bold">
                      Active Living Edition
                    </Text>
                    {article?.publishedAt && (
                      <Text size={1} muted>
                        &bull; {new Date(article.publishedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </Flex>

                  {slug && (
                    <Button
                      mode="bleed"
                      fontSize={1}
                      icon={LaunchIcon}
                      text="View on Web (Live)"
                      as="a"
                      href={`${webBaseUrl}/${slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  )}
                </Flex>
                {article?.versionChangelog && (
                  <Text size={1} muted>
                    <em>Changelog: {article.versionChangelog}</em>
                  </Text>
                )}
              </Stack>
            </Card>

            {/* Historical Snapshots */}
            {snapshots.map((snap) => (
              <Card key={snap._id} padding={3} radius={2} tone="default" border>
                <Stack gap={2}>
                  <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                    <Flex align="center" gap={2}>
                      <Badge tone="default" fontSize={1}>
                        Edition v{snap.versionNumber}
                      </Badge>
                      <Text size={1} weight="semibold">
                        Archival Snapshot
                      </Text>
                      {snap.publishedAt && (
                        <Text size={1} muted>
                          &bull; Recorded {new Date(snap.publishedAt).toLocaleString()}
                        </Text>
                      )}
                    </Flex>

                    {slug && (
                      <Button
                        mode="ghost"
                        fontSize={1}
                        icon={LaunchIcon}
                        text={`View v${snap.versionNumber} Reader`}
                        as="a"
                        href={`${webBaseUrl}/${slug}/v${snap.versionNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    )}
                  </Flex>

                  {snap.changeSummary && (
                    <Card tone="transparent" padding={2} radius={2} border>
                      <Text size={1}>
                        <strong>Endringslogg / Changelog: </strong>
                        {snap.changeSummary}
                      </Text>
                    </Card>
                  )}
                </Stack>
              </Card>
            ))}

            {snapshots.length === 0 && (
              <Card padding={4} radius={2} tone="caution" border>
                <Stack gap={2}>
                  <Text size={1} weight="semibold">
                    No frozen archival snapshots recorded yet
                  </Text>
                  <Text size={1} muted>
                    This treatise is currently in its initial edition (v{currentVersion}). Minor
                    typo and link edits update in-place without generating snapshots. To freeze an
                    official scientific revision, click <strong>&ldquo;Record Snapshot (v{currentVersion + 1})&rdquo;</strong> at the bottom of the editor pane.
                  </Text>
                </Stack>
              </Card>
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  )
}
