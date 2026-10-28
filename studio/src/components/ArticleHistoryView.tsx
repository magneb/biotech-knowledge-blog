import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {IntentLink} from 'sanity/router'
import {EditIcon} from '@sanity/icons/Edit'
import {LaunchIcon} from '@sanity/icons/Launch'
import {RevertIcon} from '@sanity/icons/Revert'
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
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncNotice, setSyncNotice] = useState<string | null>(null)

  const fetchSnapshots = async () => {
    setIsLoading(true)
    try {
      const results = await client.fetch<SnapshotRecord[]>(
        `*[_type == "articleVersion" && article._ref == $rawId] | order(versionNumber desc){
          _id, versionNumber, publishedAt, changeSummary, snapshotTitle
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

  const maxSnapshotVersion =
    snapshots.length > 0 ? Math.max(...snapshots.map((s) => s.versionNumber)) : 1
  const hasEditionDiscrepancy =
    currentVersion !== maxSnapshotVersion && (snapshots.length > 0 || currentVersion > 1)

  const handleSyncVersion = async (targetVersion: number) => {
    setIsSyncing(true)
    setSyncNotice(null)
    try {
      const tx = client.transaction()
      tx.patch(rawId, (p) => p.set({versionNumber: targetVersion}))
      const draft = await client.getDocument(`drafts.${rawId}`)
      if (draft) tx.patch(`drafts.${rawId}`, (p) => p.set({versionNumber: targetVersion}))
      await tx.commit()
      setSyncNotice(`Active edition successfully synced to v${targetVersion}.`)
      await fetchSnapshots()
    } catch (err) {
      console.error('Failed to sync edition number:', err)
      setSyncNotice('Failed to sync edition number. Check console for details.')
    } finally {
      setIsSyncing(false)
    }
  }

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
                <Heading size={2}>Official Edition Timeline</Heading>
                <Badge tone="positive" fontSize={1} padding={2}>Current: v{currentVersion}</Badge>
              </Flex>
              <Text size={1} muted>
                Historical edition snapshots recorded in Sanity Content Lake for treatise:{' '}
                <strong>&ldquo;{article?.title || 'Untitled'}&rdquo;</strong>. Archival editions can
                be directly opened, edited to correct typos or formatting, and viewed on the web.
              </Text>
            </Stack>
            <Flex gap={2} align="center">
              <Button
                mode="ghost"
                icon={SyncIcon}
                text="Refresh"
                onClick={fetchSnapshots}
                disabled={isLoading || isSyncing}
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

        {/* Sync Status Toast Notice */}
        {syncNotice && (
          <Card padding={3} radius={2} tone="positive" border>
            <Text size={1}>{syncNotice}</Text>
          </Card>
        )}

        {/* Edition Counter Discrepancy Notice & Safe Recovery */}
        {hasEditionDiscrepancy && (
          <Card padding={3} radius={2} tone="caution" border>
            <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
              <Stack gap={1}>
                <Flex align="center" gap={2}>
                  <Badge tone="caution" fontSize={1}>Edition Discrepancy Detected</Badge>
                  <Text size={1} weight="semibold">
                    Active edition is v{currentVersion}, but latest recorded snapshot is v{maxSnapshotVersion}
                  </Text>
                </Flex>
                <Text size={1} muted>
                  If an archival snapshot was deleted or pruned, safely re-align the active edition counter to match existing snapshots.
                </Text>
              </Stack>
              <Button
                tone="caution"
                mode="ghost"
                fontSize={1}
                icon={RevertIcon}
                text={`Sync Active Edition to v${maxSnapshotVersion}`}
                disabled={isSyncing}
                onClick={() => handleSyncVersion(maxSnapshotVersion)}
              />
            </Flex>
          </Card>
        )}

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
                    <Badge tone="positive" fontSize={1}>Edition v{currentVersion}</Badge>
                    <Text size={1} weight="bold">Active Living Edition</Text>
                    {article?.publishedAt && (
                      <Text size={1} muted>&bull; {new Date(article.publishedAt).toLocaleDateString()}</Text>
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
                  <Text size={1} muted><em>Changelog: {article.versionChangelog}</em></Text>
                )}
              </Stack>
            </Card>

            {/* Historical Snapshots */}
            {snapshots.map((snap) => (
              <Card key={snap._id} padding={3} radius={2} tone="default" border>
                <Stack gap={2}>
                  <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                    <Flex align="center" gap={2}>
                      <Badge tone="default" fontSize={1}>Edition v{snap.versionNumber}</Badge>
                      <Text size={1} weight="semibold">Archival Snapshot</Text>
                      {snap.publishedAt && (
                        <Text size={1} muted>&bull; Recorded {new Date(snap.publishedAt).toLocaleString()}</Text>
                      )}
                    </Flex>
                    <Flex gap={2}>
                      <Button
                        as={IntentLink}
                        intent="edit"
                        params={{id: snap._id, type: 'articleVersion'}}
                        mode="ghost"
                        fontSize={1}
                        icon={EditIcon}
                        text="Edit Snapshot in Studio"
                      />
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
                  </Flex>
                  {snap.changeSummary && (
                    <Card tone="transparent" padding={2} radius={2} border>
                      <Text size={1}><strong>Edition Changelog: </strong>{snap.changeSummary}</Text>
                    </Card>
                  )}
                </Stack>
              </Card>
            ))}

            {snapshots.length === 0 && (
              <Card padding={4} radius={2} tone="caution" border>
                <Stack gap={2}>
                  <Text size={1} weight="semibold">No archival edition snapshots recorded yet</Text>
                  <Text size={1} muted>
                    This treatise is currently in its active initial edition (v{currentVersion}).
                    Minor typo, date, and link edits publish in-place without generating new
                    snapshots. To record an official scientific revision, navigate to the{' '}
                    <strong>&ldquo;Versioning &amp; Archival&rdquo;</strong> tab, toggle{' '}
                    <strong>&ldquo;Publish as New Official Edition&rdquo;</strong>, enter your
                    changelog notes, and click <strong>Publish</strong>. Past snapshots can be
                    directly opened, edited, or recovered at any time.
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
