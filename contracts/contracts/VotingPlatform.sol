// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title VotingPlatform
 * @notice Multi-election blockchain voting platform for Hyperledger Besu.
 *         - Super-admin can create elections and manage candidates
 *         - Candidates can self-register (pending admin approval)
 *         - One vote per address per election (enforced on-chain)
 *         - Elections automatically close when block.timestamp exceeds votingEnd
 */
contract VotingPlatform {

    // ─────────────────────────────────────────────────────────────────────────
    // Structs
    // ─────────────────────────────────────────────────────────────────────────

    struct Election {
        uint256 id;
        string  title;
        string  description;
        string  imageUrl;
        uint256 registrationStart;  // when candidates can start registering
        uint256 registrationEnd;    // candidate registration deadline
        uint256 votingStart;        // when voting opens
        uint256 votingEnd;          // when voting closes (auto-enforced)
        uint256 totalVotes;
        bool    exists;
    }

    struct Candidate {
        uint256 id;
        uint256 electionId;
        string  name;
        string  description;
        string  imageUrl;
        address walletAddress;
        uint256 voteCount;
        bool    approved;
        bool    exists;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // State Variables
    // ─────────────────────────────────────────────────────────────────────────

    address public superAdmin;

    mapping(address => bool) public isAdmin;

    uint256 private _electionIdCounter;
    mapping(uint256 => Election) public elections;
    uint256[] private _electionIds;

    uint256 private _candidateIdCounter;
    // electionId => candidateId => Candidate
    mapping(uint256 => mapping(uint256 => Candidate)) public candidates;
    // electionId => list of candidate IDs
    mapping(uint256 => uint256[]) private _candidateIds;

    // electionId => voter address => has voted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // electionId => voter address => candidateId they voted for
    mapping(uint256 => mapping(address => uint256)) public voterChoice;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event AdminGranted(address indexed account);
    event AdminRevoked(address indexed account);

    event ElectionCreated(
        uint256 indexed electionId,
        string title,
        uint256 votingStart,
        uint256 votingEnd
    );
    event ElectionUpdated(uint256 indexed electionId);

    event CandidateAdded(
        uint256 indexed electionId,
        uint256 indexed candidateId,
        string name,
        address walletAddress,
        bool approved
    );
    event CandidateApproved(uint256 indexed electionId, uint256 indexed candidateId);
    event CandidateRejected(uint256 indexed electionId, uint256 indexed candidateId);

    event VoteCast(
        uint256 indexed electionId,
        uint256 indexed candidateId,
        address indexed voter
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────────────────

    modifier onlySuperAdmin() {
        require(msg.sender == superAdmin, "VotingPlatform: caller is not super admin");
        _;
    }

    modifier onlyAdmin() {
        require(isAdmin[msg.sender] || msg.sender == superAdmin, "VotingPlatform: caller is not admin");
        _;
    }

    modifier electionExists(uint256 electionId) {
        require(elections[electionId].exists, "VotingPlatform: election does not exist");
        _;
    }

    modifier candidateExists(uint256 electionId, uint256 candidateId) {
        require(candidates[electionId][candidateId].exists, "VotingPlatform: candidate does not exist");
        _;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor() {
        superAdmin = msg.sender;
        isAdmin[msg.sender] = true;
        emit AdminGranted(msg.sender);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin Management
    // ─────────────────────────────────────────────────────────────────────────

    function grantAdmin(address account) external onlySuperAdmin {
        require(account != address(0), "VotingPlatform: zero address");
        isAdmin[account] = true;
        emit AdminGranted(account);
    }

    function revokeAdmin(address account) external onlySuperAdmin {
        require(account != superAdmin, "VotingPlatform: cannot revoke super admin");
        isAdmin[account] = false;
        emit AdminRevoked(account);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Election Management
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Create a new election.
     * @param title             Human-readable election title
     * @param description       Detailed description of the election
     * @param imageUrl          Optional cover image URL
     * @param registrationStart Unix timestamp — candidate registration opens
     * @param registrationEnd   Unix timestamp — candidate registration closes
     * @param votingStart       Unix timestamp — voting opens
     * @param votingEnd         Unix timestamp — voting closes (auto-enforced)
     */
    function createElection(
        string calldata title,
        string calldata description,
        string calldata imageUrl,
        uint256 registrationStart,
        uint256 registrationEnd,
        uint256 votingStart,
        uint256 votingEnd
    ) external onlyAdmin returns (uint256) {
        require(bytes(title).length > 0,        "VotingPlatform: empty title");
        require(registrationEnd > registrationStart, "VotingPlatform: bad registration window");
        require(votingStart >= registrationEnd,  "VotingPlatform: voting must start after registration");
        require(votingEnd > votingStart,         "VotingPlatform: bad voting window");
        require(votingEnd > block.timestamp,     "VotingPlatform: election already expired");

        _electionIdCounter++;
        uint256 eid = _electionIdCounter;

        elections[eid] = Election({
            id:                eid,
            title:             title,
            description:       description,
            imageUrl:          imageUrl,
            registrationStart: registrationStart,
            registrationEnd:   registrationEnd,
            votingStart:       votingStart,
            votingEnd:         votingEnd,
            totalVotes:        0,
            exists:            true
        });

        _electionIds.push(eid);

        emit ElectionCreated(eid, title, votingStart, votingEnd);
        return eid;
    }

    /**
     * @notice Update an election's metadata (only before voting starts).
     */
    function updateElection(
        uint256 electionId,
        string calldata title,
        string calldata description,
        string calldata imageUrl,
        uint256 registrationStart,
        uint256 registrationEnd,
        uint256 votingStart,
        uint256 votingEnd
    ) external onlyAdmin electionExists(electionId) {
        Election storage e = elections[electionId];
        require(block.timestamp < e.votingStart, "VotingPlatform: voting already started");
        require(registrationEnd > registrationStart, "VotingPlatform: bad registration window");
        require(votingStart >= registrationEnd,  "VotingPlatform: voting must start after registration");
        require(votingEnd > votingStart,         "VotingPlatform: bad voting window");

        e.title             = title;
        e.description       = description;
        e.imageUrl          = imageUrl;
        e.registrationStart = registrationStart;
        e.registrationEnd   = registrationEnd;
        e.votingStart       = votingStart;
        e.votingEnd         = votingEnd;

        emit ElectionUpdated(electionId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Candidate Management
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Admin directly adds a pre-approved candidate.
     */
    function addCandidate(
        uint256 electionId,
        string calldata name,
        string calldata description,
        string calldata imageUrl,
        address walletAddress
    ) external onlyAdmin electionExists(electionId) returns (uint256) {
        Election storage e = elections[electionId];
        require(block.timestamp < e.votingEnd, "VotingPlatform: election has ended");

        return _createCandidate(electionId, name, description, imageUrl, walletAddress, true);
    }

    /**
     * @notice Voter self-registers as a candidate during the registration window.
     *         Requires admin approval before votes can be cast for them.
     */
    function registerAsCandidate(
        uint256 electionId,
        string calldata name,
        string calldata description,
        string calldata imageUrl
    ) external electionExists(electionId) returns (uint256) {
        Election storage e = elections[electionId];
        require(block.timestamp >= e.registrationStart, "VotingPlatform: registration not open yet");
        require(block.timestamp <= e.registrationEnd,   "VotingPlatform: registration window closed");

        return _createCandidate(electionId, name, description, imageUrl, msg.sender, false);
    }

    function _createCandidate(
        uint256 electionId,
        string calldata name,
        string calldata description,
        string calldata imageUrl,
        address walletAddress,
        bool approved
    ) internal returns (uint256) {
        require(bytes(name).length > 0, "VotingPlatform: empty candidate name");
        require(walletAddress != address(0), "VotingPlatform: zero address");

        _candidateIdCounter++;
        uint256 cid = _candidateIdCounter;

        candidates[electionId][cid] = Candidate({
            id:            cid,
            electionId:    electionId,
            name:          name,
            description:   description,
            imageUrl:      imageUrl,
            walletAddress: walletAddress,
            voteCount:     0,
            approved:      approved,
            exists:        true
        });

        _candidateIds[electionId].push(cid);

        emit CandidateAdded(electionId, cid, name, walletAddress, approved);
        return cid;
    }

    /**
     * @notice Admin approves a self-registered candidate.
     */
    function approveCandidate(uint256 electionId, uint256 candidateId)
        external
        onlyAdmin
        electionExists(electionId)
        candidateExists(electionId, candidateId)
    {
        Election storage e = elections[electionId];
        require(block.timestamp < e.votingEnd, "VotingPlatform: election has ended");
        candidates[electionId][candidateId].approved = true;
        emit CandidateApproved(electionId, candidateId);
    }

    /**
     * @notice Admin rejects (removes) a self-registered candidate.
     */
    function rejectCandidate(uint256 electionId, uint256 candidateId)
        external
        onlyAdmin
        electionExists(electionId)
        candidateExists(electionId, candidateId)
    {
        candidates[electionId][candidateId].approved = false;
        candidates[electionId][candidateId].exists   = false;
        emit CandidateRejected(electionId, candidateId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Voting
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Cast a vote for a candidate in an election.
     *         - Election must be in the active voting window
     *         - Voter can only vote once per election (enforced by address)
     *         - Candidate must be approved
     */
    function vote(uint256 electionId, uint256 candidateId)
        external
        electionExists(electionId)
        candidateExists(electionId, candidateId)
    {
        Election storage e = elections[electionId];
        require(block.timestamp >= e.votingStart, "VotingPlatform: voting has not started yet");
        require(block.timestamp <= e.votingEnd,   "VotingPlatform: voting has ended");
        require(!hasVoted[electionId][msg.sender], "VotingPlatform: already voted in this election");
        require(candidates[electionId][candidateId].approved, "VotingPlatform: candidate not approved");

        hasVoted[electionId][msg.sender]    = true;
        voterChoice[electionId][msg.sender] = candidateId;
        candidates[electionId][candidateId].voteCount++;
        e.totalVotes++;

        emit VoteCast(electionId, candidateId, msg.sender);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Returns the current status of an election as a string.
     *         "Pending"      — not yet open for registration
     *         "Registration" — registration window is open
     *         "Upcoming"     — registration closed, voting not started
     *         "Active"       — voting is ongoing
     *         "Ended"        — voting period has passed
     */
    function getElectionStatus(uint256 electionId)
        external
        view
        electionExists(electionId)
        returns (string memory)
    {
        Election storage e = elections[electionId];
        uint256 t = block.timestamp;
        if (t < e.registrationStart)  return "Pending";
        if (t <= e.registrationEnd)   return "Registration";
        if (t < e.votingStart)        return "Upcoming";
        if (t <= e.votingEnd)         return "Active";
        return "Ended";
    }

    /// @notice Get all election IDs
    function getAllElectionIds() external view returns (uint256[] memory) {
        return _electionIds;
    }

    /// @notice Get election details
    function getElection(uint256 electionId)
        external
        view
        electionExists(electionId)
        returns (Election memory)
    {
        return elections[electionId];
    }

    /// @notice Get all candidate IDs for an election
    function getCandidateIds(uint256 electionId)
        external
        view
        electionExists(electionId)
        returns (uint256[] memory)
    {
        return _candidateIds[electionId];
    }

    /// @notice Get a single candidate
    function getCandidate(uint256 electionId, uint256 candidateId)
        external
        view
        electionExists(electionId)
        candidateExists(electionId, candidateId)
        returns (Candidate memory)
    {
        return candidates[electionId][candidateId];
    }

    /**
     * @notice Get all approved candidates for an election with their vote counts.
     *         Useful for displaying results.
     */
    function getResults(uint256 electionId)
        external
        view
        electionExists(electionId)
        returns (Candidate[] memory)
    {
        uint256[] storage ids = _candidateIds[electionId];
        uint256 count;
        for (uint256 i = 0; i < ids.length; i++) {
            if (candidates[electionId][ids[i]].approved) count++;
        }

        Candidate[] memory result = new Candidate[](count);
        uint256 idx;
        for (uint256 i = 0; i < ids.length; i++) {
            Candidate storage c = candidates[electionId][ids[i]];
            if (c.approved) {
                result[idx++] = c;
            }
        }
        return result;
    }

    /// @notice Returns current block timestamp (useful for frontend time-sync checks)
    function currentTime() external view returns (uint256) {
        return block.timestamp;
    }
}
