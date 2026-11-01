# Voting Platform Documentation

Modern, interactive documentation site for the **Organizational Voting Platform**, powered by [Fumadocs](https://fumadocs.dev), Next.js, and OpenAPI.

---

## 🚀 Running the Documentation

```bash
# Navigate to docs directory
cd docs

# Start local documentation server on http://localhost:3002
pnpm dev
```

Visit [http://localhost:3002](http://localhost:3002) in your browser.

---

## 🔄 Updating API Reference (OpenAPI Sync)

Whenever you add or change endpoints in the NestJS backend, re-sync the documentation with two simple commands:

```bash
# Step 1: Export latest OpenAPI schema from NestJS backend
cd ../backend
pnpm run export:openapi

# Step 2: Regenerate interactive API reference MDX pages
cd ../docs
pnpm run generate:api
```

---

## 📁 Content Directory Structure

```
docs/
├── content/docs/
│   ├── index.mdx                       # Introduction & feature summary
│   ├── getting-started/
│   │   ├── quickstart.mdx              # Prerequisites, Docker, database seeders
│   │   └── configuration.mdx           # Environment variables reference
│   ├── architecture/
│   │   ├── system-overview.mdx         # 3-tier architecture & data boundaries
│   │   ├── election-lifecycle.mdx      # 5-stage state machine & auto-sync
│   │   └── voting-protocol.mdx         # Zero-gas relayer & vote privacy
│   ├── smart-contracts/
│   │   ├── overview.mdx                # Hardhat, Besu, and Sepolia testnet
│   │   └── voting-contract.mdx         # VotingPlatform.sol specifications
│   ├── guides/
│   │   ├── admin-guide.mdx             # Managing elections, rules & candidates
│   │   └── voter-guide.mdx             # Casting ballots & auditing receipts
│   └── api/                            # Auto-generated interactive OpenAPI pages
│       ├── auth.mdx
│       ├── elections.mdx
│       ├── candidates.mdx
│       ├── voting.mdx
│       ├── organizations.mdx
│       ├── organizational-units.mdx
│       ├── employees.mdx
│       └── positions.mdx
```
