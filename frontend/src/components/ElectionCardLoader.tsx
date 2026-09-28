'use client';

import { useElection, useCandidateIds } from '@/lib/hooks/useContract';
import { ElectionCard } from './ElectionCard';
import { Election } from '@/lib/abi/votingPlatform';

interface Props {
  electionId: bigint;
}

export function ElectionCardLoader({ electionId }: Props) {
  const { data: electionRaw, isLoading, isError } = useElection(electionId);
  const election = electionRaw as unknown as Election | undefined;
  const { data: candidateIdsRaw } = useCandidateIds(electionId);
  const candidateIds = candidateIdsRaw as readonly bigint[] | undefined;

  if (isLoading) {
    return (
      <div className="panel" style={{ padding: '1.5rem 1rem', minHeight: 120, display: 'flex', alignItems: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (isError || !election || !election.exists) {
    return null;
  }

  return (
    <ElectionCard
      election={election as unknown as Election}
      candidateCount={candidateIds ? candidateIds.length : 0}
    />
  );
}
