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
      <div className="card" style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (isError || !election || !election.exists) {
    return null; // Don't render broken cards
  }

  return (
    <ElectionCard
      election={election as unknown as Election}
      candidateCount={candidateIds ? candidateIds.length : 0}
    />
  );
}
