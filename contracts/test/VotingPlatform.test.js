const { expect } = require("chai");
const { ethers }  = require("hardhat");
const { time }    = require("@nomicfoundation/hardhat-network-helpers");

describe("VotingPlatform", function () {
  let platform;
  let owner, admin2, voter1, voter2, voter3, candidate1;

  // Use blockchain time (not wall clock) to avoid drift after time.increase()
  const latestPlus = async (s) => (await time.latest()) + s;

  beforeEach(async function () {
    [owner, admin2, voter1, voter2, voter3, candidate1] = await ethers.getSigners();
    const VotingPlatform = await ethers.getContractFactory("VotingPlatform");
    platform = await VotingPlatform.deploy();
    await platform.waitForDeployment();
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe("Deployment", function () {
    it("sets deployer as super admin", async function () {
      expect(await platform.superAdmin()).to.equal(owner.address);
      expect(await platform.isAdmin(owner.address)).to.be.true;
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe("Admin Management", function () {
    it("super admin can grant admin", async function () {
      await platform.grantAdmin(admin2.address);
      expect(await platform.isAdmin(admin2.address)).to.be.true;
    });

    it("super admin can revoke admin", async function () {
      await platform.grantAdmin(admin2.address);
      await platform.revokeAdmin(admin2.address);
      expect(await platform.isAdmin(admin2.address)).to.be.false;
    });

    it("non-super-admin cannot grant admin", async function () {
      await expect(
        platform.connect(voter1).grantAdmin(admin2.address)
      ).to.be.revertedWith("VotingPlatform: caller is not super admin");
    });

    it("cannot revoke super admin", async function () {
      await expect(
        platform.revokeAdmin(owner.address)
      ).to.be.revertedWith("VotingPlatform: cannot revoke super admin");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe("Election Creation", function () {
    it("admin can create an election", async function () {
      const r = await latestPlus(10), re = await latestPlus(60),
            vs = await latestPlus(70), ve = await latestPlus(3600);
      await platform.createElection("Test Election", "Description", "", r, re, vs, ve);
      const el = await platform.getElection(1n);
      expect(el.title).to.equal("Test Election");
      expect(el.exists).to.be.true;
    });

    it("non-admin cannot create an election", async function () {
      const r = await latestPlus(10), re = await latestPlus(60),
            vs = await latestPlus(70), ve = await latestPlus(3600);
      await expect(
        platform.connect(voter1).createElection("X", "Y", "", r, re, vs, ve)
      ).to.be.revertedWith("VotingPlatform: caller is not admin");
    });

    it("rejects bad registration window", async function () {
      const t = await time.latest();
      await expect(
        platform.createElection("X", "Y", "", t + 60, t + 10, t + 70, t + 3600)
      ).to.be.revertedWith("VotingPlatform: bad registration window");
    });

    it("returns all election IDs", async function () {
      const r = await latestPlus(10), re = await latestPlus(60),
            vs = await latestPlus(70), ve = await latestPlus(3600);
      await platform.createElection("E1", "D", "", r, re, vs, ve);
      await platform.createElection("E2", "D", "", r, re, vs, ve);
      const ids = await platform.getAllElectionIds();
      expect(ids.length).to.equal(2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe("Candidate Management", function () {
    let eid;

    beforeEach(async function () {
      const r = await latestPlus(10), re = await latestPlus(60),
            vs = await latestPlus(70), ve = await latestPlus(3600);
      await platform.createElection("Election 1", "Desc", "", r, re, vs, ve);
      eid = 1n;
    });

    it("admin adds pre-approved candidate", async function () {
      await platform.addCandidate(eid, "Alice", "Bio", "", candidate1.address);
      const ids = await platform.getCandidateIds(eid);
      const c   = await platform.getCandidate(eid, ids[0]);
      expect(c.name).to.equal("Alice");
      expect(c.approved).to.be.true;
    });

    it("voter self-registers during registration window", async function () {
      await time.increase(15); // into registration window
      await platform.connect(voter1).registerAsCandidate(eid, "Bob", "Bio", "");
      const ids = await platform.getCandidateIds(eid);
      const c   = await platform.getCandidate(eid, ids[0]);
      expect(c.walletAddress).to.equal(voter1.address);
      expect(c.approved).to.be.false;
    });

    it("admin can approve a self-registered candidate", async function () {
      await time.increase(15);
      await platform.connect(voter1).registerAsCandidate(eid, "Bob", "Bio", "");
      const ids = await platform.getCandidateIds(eid);
      await platform.approveCandidate(eid, ids[0]);
      const c = await platform.getCandidate(eid, ids[0]);
      expect(c.approved).to.be.true;
    });

    it("cannot self-register before window opens", async function () {
      // Don't advance time — we're at block time before regStart (+10s)
      await expect(
        platform.connect(voter1).registerAsCandidate(eid, "Bob", "Bio", "")
      ).to.be.revertedWith("VotingPlatform: registration not open yet");
    });

    it("cannot self-register after window closes", async function () {
      await time.increase(65); // past regEnd (+60s)
      await expect(
        platform.connect(voter1).registerAsCandidate(eid, "Bob", "Bio", "")
      ).to.be.revertedWith("VotingPlatform: registration window closed");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe("Voting", function () {
    let eid, cid;

    beforeEach(async function () {
      const r = await latestPlus(5),  re = await latestPlus(30),
            vs = await latestPlus(40), ve = await latestPlus(3600);
      await platform.createElection("Vote Test", "Desc", "", r, re, vs, ve);
      eid = 1n;
      await platform.addCandidate(eid, "Alice", "Bio", "", candidate1.address);
      const ids = await platform.getCandidateIds(eid);
      cid = ids[0];
    });

    it("voter casts a vote during voting window", async function () {
      await time.increase(45);
      await platform.connect(voter1).vote(eid, cid);
      expect(await platform.hasVoted(eid, voter1.address)).to.be.true;
      const c = await platform.getCandidate(eid, cid);
      expect(c.voteCount).to.equal(1n);
    });

    it("reverts on double vote", async function () {
      await time.increase(45);
      await platform.connect(voter1).vote(eid, cid);
      await expect(
        platform.connect(voter1).vote(eid, cid)
      ).to.be.revertedWith("VotingPlatform: already voted in this election");
    });

    it("reverts before voting window opens", async function () {
      // Don't advance time — still before votingStart (+40s)
      await expect(
        platform.connect(voter1).vote(eid, cid)
      ).to.be.revertedWith("VotingPlatform: voting has not started yet");
    });

    it("reverts after voting window ends", async function () {
      await time.increase(3700);
      await expect(
        platform.connect(voter1).vote(eid, cid)
      ).to.be.revertedWith("VotingPlatform: voting has ended");
    });

    it("reverts vote for unapproved candidate", async function () {
      await time.increase(10); // in registration window
      await platform.connect(voter2).registerAsCandidate(eid, "Bob", "Bio", "");
      const ids = await platform.getCandidateIds(eid);
      const pendingCid = ids[1];
      await time.increase(35); // into voting window
      await expect(
        platform.connect(voter1).vote(eid, pendingCid)
      ).to.be.revertedWith("VotingPlatform: candidate not approved");
    });

    it("multiple voters, correct totals", async function () {
      await platform.addCandidate(eid, "Charlie", "Bio", "", voter3.address);
      const ids  = await platform.getCandidateIds(eid);
      const cid2 = ids[1];
      await time.increase(45);
      await platform.connect(voter1).vote(eid, cid);
      await platform.connect(voter2).vote(eid, cid2);
      const el = await platform.getElection(eid);
      expect(el.totalVotes).to.equal(2n);
    });

    it("getResults returns correct vote counts", async function () {
      await time.increase(45);
      await platform.connect(voter1).vote(eid, cid);
      await platform.connect(voter2).vote(eid, cid);
      const results = await platform.getResults(eid);
      expect(results[0].voteCount).to.equal(2n);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  describe("Election Status", function () {
    it("transitions through all statuses correctly", async function () {
      const r = await latestPlus(10), re = await latestPlus(30),
            vs = await latestPlus(40), ve = await latestPlus(100);
      await platform.createElection("Status Test", "Desc", "", r, re, vs, ve);
      const eid = 1n;

      expect(await platform.getElectionStatus(eid)).to.equal("Pending");
      await time.increase(15);
      expect(await platform.getElectionStatus(eid)).to.equal("Registration");
      await time.increase(20);
      expect(await platform.getElectionStatus(eid)).to.equal("Upcoming");
      await time.increase(15);
      expect(await platform.getElectionStatus(eid)).to.equal("Active");
      await time.increase(70);
      expect(await platform.getElectionStatus(eid)).to.equal("Ended");
    });
  });
});
