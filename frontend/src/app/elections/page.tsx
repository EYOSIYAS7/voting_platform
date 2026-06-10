'use client';

import { useState, useMemo } from 'react';
import { useAllElectionIds, useContractAddress } from '@/lib/hooks/useContract';
import { VOTING_PLATFORM_ABI, Election } from '@/lib/abi/votingPlatform';
import { useReadContracts } from 'wagmi';
import { ElectionCard } from '@/components/ElectionCard';
import { Search, Filter, ShieldAlert } from 'lucide-react';
import styles from './elections.module.css';

export default function ElectionsPage() {
  const contractAddress = useContractAddress();
  const { data: electionIdsRaw, isLoading: isIdsLoading } = useAllElectionIds();
  const electionIds = electionIdsRaw as readonly bigint[] | undefined;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Upcoming' | 'Registration' | 'Ended'>('All');

  // Prepare batch read for election details
  const electionQueries = useMemo(() => {
    if (!electionIds) return [];
    return electionIds.map((id) => ({
      address:      contractAddress,
      abi:          VOTING_PLATFORM_ABI as any,
      functionName: 'getElection',
      args:         [id],
    }));
  }, [electionIds, contractAddress]);

  // Prepare batch read for candidate counts
  const candidateQueries = useMemo(() => {
    if (!electionIds) return [];
    return electionIds.map((id) => ({
      address:      contractAddress,
      abi:          VOTING_PLATFORM_ABI as any,
      functionName: 'getCandidateIds',
      args:         [id],
    }));
  }, [electionIds, contractAddress]);

  // Execute batched multicalls
  const { data: electionsData, isLoading: isDetailsLoading } = useReadContracts({
    contracts: electionQueries as any,
    query:     { enabled: electionQueries.length > 0 },
  });

  const { data: candidateIdsData } = useReadContracts({
    contracts: candidateQueries as any,
    query:     { enabled: candidateQueries.length > 0 },
  });

  // Map and filter elections
  const processedElections = useMemo(() => {
    if (!electionsData || !electionIds) return [];

    const now = Math.floor(Date.now() / 1000);

    return electionsData
      .map((res: any, idx) => {
        const val = res.result || res;
        if (!val || !val.exists) return null;

        // Parse candidate count
        const candIdsVal = candidateIdsData?.[idx];
        const resolvedCandIds = candIdsVal ? (candIdsVal.result || candIdsVal) as any : null;
        const candidateCount = resolvedCandIds && Array.isArray(resolvedCandIds) 
          ? resolvedCandIds.length 
          : 0;

        // Map contract tuple to clean object
        const election: Election = {
          id:                val.id,
          title:             val.title,
          description:       val.description,
          imageUrl:          val.imageUrl,
          registrationStart: val.registrationStart,
          registrationEnd:   val.registrationEnd,
          votingStart:       val.votingStart,
          votingEnd:         val.votingEnd,
          totalVotes:        val.totalVotes,
          exists:            val.exists,
        };

        // Determine status synchronously for instant filtering
        const regStart  = Number(election.registrationStart);
        const regEnd    = Number(election.registrationEnd);
        const voteStart = Number(election.votingStart);
        const voteEnd   = Number(election.votingEnd);

        let status: Election['status'] = 'Ended';
        if (now < regStart)  status = 'Pending';
        else if (now <= regEnd)   status = 'Registration';
        else if (now < voteStart) status = 'Upcoming';
        else if (now <= voteEnd)  status = 'Active';

        return { election, candidateCount, status };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);
  }, [electionsData, candidateIdsData, electionIds]);

  // Apply search query and status filter
  const filteredElections = useMemo(() => {
    return processedElections.filter(({ election, status }) => {
      const matchesSearch = election.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        election.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = activeFilter === 'All' || status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [processedElections, searchQuery, activeFilter]);

  const isLoading = isIdsLoading || isDetailsLoading;

  return (
    <div className="container animate-fade-in">
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>Browse Elections</h1>
            <p className={styles.desc}>
              Participate in active votes, view upcoming polls, and read finalized results.
            </p>
          </div>
        </div>

        {/* Controls: Filters & Search */}
        <div className={styles.controls}>
          <div className={styles.filters}>
            {(['All', 'Active', 'Registration', 'Upcoming', 'Ended'] as const).map((filter) => (
              <button
                key={filter}
                className={`${styles.filterBtn} ${activeFilter === filter ? styles.filterBtnActive : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter === 'Active' ? 'Live' : filter === 'Registration' ? 'Open Reg.' : filter}
              </button>
            ))}
          </div>

          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search elections..."
              className="form-input styles.searchInput"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className={styles.loaderContainer}>
          <div className="spinner" />
        </div>
      ) : filteredElections.length === 0 ? (
        <div className="card empty-state" style={{ margin: '2rem 0 6rem' }}>
          <ShieldAlert size={48} />
          <h3>No elections match your criteria</h3>
          <p>Try resetting your filter, checking your spelling, or creating a new election in the Admin panel.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredElections.map(({ election, candidateCount }) => (
            <ElectionCard
              key={election.id.toString()}
              election={election}
              candidateCount={candidateCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
