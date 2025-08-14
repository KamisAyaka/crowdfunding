# 🏗 Scaffold-ETH 2 - Decentralized Crowdfunding Platform

<h4 align="center">
  <a href="https://docs.scaffoldeth.io">Documentation</a> |
  <a href="https://scaffoldeth.io">Website</a>
</h4>

🧪 An open-source, up-to-date toolkit for building decentralized applications (dapps) on the Ethereum blockchain. This project is a customized implementation of Scaffold-ETH 2 for a decentralized crowdfunding platform with NFT rewards and on-chain governance.

⚙️ Built using NextJS, RainbowKit, Foundry, Wagmi, Viem, and Typescript.

## 🎉 Project Overview

This system implements a decentralized crowdfunding platform with three core smart contracts:

- 🎉 **Decentralized Crowdfunding**: Support project creation, fund donations, and result tracking
- 🎨 **Dynamic NFT Rewards**: The frontend automatically passes the top 5 donors' addresses to the contract when a project is successfully completed. The contract then generates collectible cake-themed NFTs and sends them to the donors. Project creators can also directly interact with the contract to specify NFT recipients as long as they are in the donor list.
- 🗳️ **On-chain Governance**: A proposal mechanism implements transparent fund management. When a project is successfully completed, the creator can only access 25% of the total funds. To access more funds, they must create proposals for voting. If a proposal fails three times consecutively, the project is marked as failed and donors can reclaim their balance.
- ⚖️ **Dual Protection Mechanism**: Fund release upon project success and automatic refunds upon project failure

## 📄 Smart Contracts

### 1. Crowdfunding Main Contract

#### Key Functions
- `createProject()` Create new projects (name/description/goal/deadline)
- `donate()` Support ETH donations and update donor rankings
- `completeProject()` After project ends, determine if funding goal was reached:
  - ✅ Success: Release 25% funds + Mint NFTs
  - ❌ Failure: Enable refund channel
- `withdrawFunds()` Creator can withdraw funds in stages (initially 25%, more requires successful proposals)
- `refund()` Donors can reclaim funds if project fails

#### Data Structure
```solidity
struct Project {
    uint id; // Unique project identifier
    address payable creator; // Project creator address
    string name; // Project name
    string description; // Project description
    uint goal; // Funding goal amount
    uint deadline; // Deadline timestamp
    uint currentAmount; // Current remaining funds
    uint totalAmount; // Total funds raised
    uint allowence; // Amount proposer is allowed to use
    bool completed; // Whether project is completed
    bool isSuccessful; // Whether project succeeded
}
```

### 2. CrowdfundingNFT Contract

#### NFT Features
- 🖼️ **Dynamic SVG Generation**: Uses `createSvgNftFromSeed()` to generate 7-layer cake images
- 📝 **Metadata Includes**:
  - Project ID
  - Donation amount
  - Donation ranking (1-5) if called from frontend, otherwise by manual order
- 🔒 **Secure Minting**: Only the project contract can call `mintNFT()`

#### Visual Elements
```solidity
struct CakeColors {
    string plateColor;         // Plate color
    string bottomColor;        // Bottom cake layer
    string topColor;           // Top cake layer
    string frostingColor;      // Frosting color
    string candleColor;        // Candle color
    string decorationsColor;   // Decorations color
    string icingSwirlsColor;   // Icing swirls color
}
```

### 3. ProposalGovernance Contract

#### Proposal Lifecycle
1. **Create Proposal** `createProposal()`
   - Creator only
   - Only one active proposal at a time
   - Voting period 1-7 days

2. **Voting Mechanism** `voteOnProposal()`
   - ⚖️ Weight proportional to donation amount
   - ✅ Support/❌ Against votes tracked separately
   - Proposal passes if supporting amount >= 60% of total votes
   - 🕒 Can only finalize after deadline

3. **Proposal Execution** `executeProposal()`
   - Passed: Increase project allowance
   - Rejected: Increment failure count, 3 failures terminate project

## 🖥️ Frontend Architecture

### Tech Stack
- **Next.js 14** (App Router mode)
- **Wagmi v2** + **RainbowKit** wallet connection
- **Tailwind CSS** styling framework
- **react-hot-toast** notification system

### Core Modules
```
app/
├── create-project/     # Project creation page
├── project/[id]/       # Project detail page
│   ├── proposals/      # Proposal subsystem
│   │   ├── [proposalId]/ # Proposal detail page
│   │   └── create/     # Proposal creation page
├── proposal/           # Proposal detail page
├── layout.tsx          # Global layout
├── page.tsx            # Homepage
components/
├── Header.tsx          # Navigation bar (integrated wallet connection)
├── HomePage.tsx        # Project list card component
└── NFTBox.tsx          # NFT display component (dynamic SVG rendering)
utils/
└── formatters.tsx      # Amount formatting tools (ETH unit conversion)
```

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v20.18.3)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Quickstart

To get started with this project, follow the steps below:

1. Install dependencies if it was skipped in CLI:

```
cd my-dapp-example
yarn install
```

2. Run a local network in the first terminal:

```
yarn chain
```

This command starts a local Ethereum network using Foundry. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `packages/foundry/foundry.toml`.

3. On a second terminal, deploy the test contract:

```
yarn deploy
```

This command deploys the crowdfunding smart contracts to the local network. The contracts are located in `packages/foundry/contracts` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/foundry/script` to deploy the contracts to the network.

4. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contracts using the various pages. You can tweak the app config in `packages/nextjs/scaffold.config.ts`.

Run smart contract tests with `yarn foundry:test`

- Edit your smart contracts in `packages/foundry/src`
- Edit your frontend homepage at `packages/nextjs/app/page.tsx`.
- Edit your deployment scripts in `packages/foundry/script`


## Documentation

Visit our [docs](https://docs.scaffoldeth.io) to learn how to start building with Scaffold-ETH 2.

To know more about its features, check out our [website](https://scaffoldeth.io).

## Contributing to Scaffold-ETH 2

We welcome contributions to Scaffold-ETH 2!

Please see [CONTRIBUTING.MD](https://github.com/scaffold-eth/scaffold-eth-2/blob/main/CONTRIBUTING.md) for more information and guidelines for contributing to Scaffold-ETH 2.