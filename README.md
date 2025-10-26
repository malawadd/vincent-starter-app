# Vincent DCA Backend

A robust backend service for automated Dollar Cost Averaging (DCA) cryptocurrency purchases using Lit Protocol's programmable key pairs (PKPs) and Uniswap on Base network. This service enables users to schedule recurring cryptocurrency purchases that execute automatically without manual intervention.

## Table of Contents

- [Overview](#overview)
- [What This Project Does](#what-this-project-does)
- [Key Features](#key-features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Architecture](#architecture)
- [Job Worker System](#job-worker-system)
- [Lit Protocol Integration](#lit-protocol-integration)
- [Security Considerations](#security-considerations)
- [Deployment](#deployment)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Customization](#customization)
- [License](#license)

## Overview

Vincent DCA Backend is a production-ready service that automates cryptocurrency Dollar Cost Averaging strategies. Built on top of Lit Protocol's Vincent framework, it leverages programmable key pairs (PKPs) to execute scheduled token swaps on behalf of users without requiring them to hold private keys or manually execute transactions.

### Technology Stack

- **Runtime**: Node.js v22.16.0
- **Language**: TypeScript
- **API Framework**: Express.js
- **Database**: Convex (real-time database)
- **Blockchain**: Base network (Ethereum L2)
- **DEX**: Uniswap V3
- **Authentication**: Lit Protocol Vincent SDK with JWT
- **Transaction Execution**: Lit Protocol PKPs
- **Gas Sponsorship**: Alchemy Gas Manager (optional)
- **Error Monitoring**: Sentry
- **Build Tool**: Unbuild
- **Testing**: Jest
- **Package Manager**: pnpm 10.7.0

## What This Project Does

This service enables users to:

1. **Create DCA Schedules**: Set up recurring cryptocurrency purchases with customizable intervals (daily, weekly, monthly, etc.)
2. **Automated Execution**: The system automatically executes purchases at scheduled times without user intervention
3. **Non-Custodial**: Uses Lit Protocol PKPs for transaction signing, maintaining user sovereignty
4. **Gas Management**: Optional Alchemy gas sponsorship for gasless transactions
5. **Purchase Tracking**: Complete history of all executed purchases
6. **Schedule Management**: Enable, disable, edit, or delete schedules through REST API

### How It Works

1. User authenticates with a Vincent JWT token containing PKP information
2. User creates a DCA schedule specifying:
   - Purchase amount (in USDC)
   - Purchase interval (e.g., "1 day", "1 week")
   - Target token (default: wBTC)
3. Job worker polls for due schedules every 10 seconds
4. When a schedule is due:
   - Checks user's USDC balance
   - Approves USDC spending to Uniswap router (if needed)
   - Executes swap on Uniswap V3
   - Records purchase in database
   - Schedules next execution
5. Users can view their purchase history and manage schedules via API

## Key Features

- **Flexible Scheduling**: Support for any interval (hours, days, weeks, months)
- **Automatic Retry Logic**: Handles transient failures with exponential backoff
- **Balance Monitoring**: Automatically disables schedules when insufficient funds
- **Multi-Mode Deployment**: Run as combined server, API-only, or worker-only
- **Real-Time Database**: Convex provides real-time updates and queries
- **Production Ready**: Includes error monitoring, logging, and security best practices
- **Type Safe**: Full TypeScript implementation with strict type checking
- **Gas Optimization**: Optional gas sponsorship reduces user costs
- **Version Management**: Automatic app version upgrades when users update permissions

## Prerequisites

Before setting up the project, ensure you have:

### Required Software

- **Node.js**: v22.16.0 or higher
- **pnpm**: 10.7.0 (exact version required)
- **Git**: For cloning the repository

### Required Accounts and Services

1. **Convex Account**
   - Sign up at [convex.dev](https://www.convex.dev/)
   - Create a new project
   - Obtain your deployment URL

2. **Alchemy Account** (Optional but recommended)
   - Sign up at [alchemy.com](https://www.alchemy.com/)
   - Create an API key
   - Set up a Gas Manager policy for Base network

3. **Sentry Account** (Optional, for error monitoring)
   - Sign up at [sentry.io](https://sentry.io/)
   - Create a new project
   - Obtain DSN and auth token

4. **Lit Protocol Vincent App**
   - Register a Vincent app to obtain an App ID
   - Generate a delegatee private key for transaction signing
   - Ensure you have capacity credits for Lit Protocol operations

5. **Base Network RPC**
   - Use public RPC: `https://mainnet.base.org/`
   - Or obtain a dedicated endpoint from providers like Alchemy or QuickNode

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/LIT-Protocol/vincent-dca.git
cd vincent-dca
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure all required variables (see [Configuration](#configuration) section).

### 4. Deploy Convex Schema

The Convex database schema needs to be deployed before running the application. Follow the Convex deployment instructions for your project.

### 5. Build the Project

```bash
pnpm build
```

## Project Structure

```
vincent-dca/
├── src/
│   ├── bin/                      # Entry points for different server modes
│   │   ├── apiServer.ts         # API server only
│   │   ├── jobWorker.ts         # Job worker only
│   │   ├── serverWorker.ts      # Combined API + worker
│   │   └── mintRLINft.ts        # Utility for minting capacity credits
│   ├── lib/
│   │   ├── apiServer.ts         # Express app setup
│   │   ├── jobWorker.ts         # Job worker initialization
│   │   ├── env.ts               # Environment variable validation
│   │   ├── error.ts             # Error normalization utilities
│   │   ├── logger.ts            # Logging configuration
│   │   ├── sentry.ts            # Sentry error monitoring setup
│   │   ├── convex/              # Convex database integration
│   │   │   ├── client.ts        # Convex client singleton
│   │   │   ├── executeDCASwap.ts # Core swap execution logic
│   │   │   ├── jobManager.ts    # Schedule management
│   │   │   └── jobWorker.ts     # Schedule polling and execution
│   │   ├── express/             # Express routes and middleware
│   │   │   ├── index.ts         # Route registration
│   │   │   ├── schedules.ts     # Schedule endpoints
│   │   │   ├── purchases.ts     # Purchase history endpoints
│   │   │   ├── schema.ts        # Request validation schemas
│   │   │   └── types.ts         # Express type definitions
│   │   └── utils/               # Shared utilities
│   │       ├── jobVersion.ts    # App version management
│   │       └── executeDCASwap/  # Swap execution utilities
│   ├── testHttp/                # HTTP request examples for testing
│   ├── index.ts                 # Main entry point
│   └── mintRLINft.ts            # Capacity credit minting script
├── convex/                       # Convex database definitions
│   ├── schema.ts                # Database schema
│   ├── schedules.ts             # Schedule queries and mutations
│   ├── purchases.ts             # Purchase queries
│   └── _generated/              # Auto-generated Convex types
├── dist/                         # Compiled output (after build)
├── build.config.ts              # Unbuild configuration
├── tsconfig.json                # TypeScript configuration
├── jest.config.js               # Jest testing configuration
├── .eslintrc.cjs                # ESLint rules
├── package.json                 # Project dependencies and scripts
└── README.md                    # This file
```

### Key Files Explained

- **src/bin/**: Contains executable entry points for different deployment modes
- **src/lib/convex/executeDCASwap.ts**: Core business logic for executing DCA swaps
- **src/lib/express/**: REST API implementation with routes and middleware
- **convex/schema.ts**: Defines the database structure with tables and indexes
- **src/lib/env.ts**: Validates all environment variables with type safety
- **build.config.ts**: Configures the build process to generate three executables

## Configuration

### Environment Variables

All environment variables are defined in `.env` file. Copy `.env.example` to `.env` and configure:

#### Required Variables

```bash
# Convex Database
CONVEX_URL=https://your-project.convex.cloud
# Obtain from your Convex dashboard after creating a project

# Base Network RPC
BASE_RPC_URL=https://mainnet.base.org/
# Public Base RPC or your own dedicated endpoint

# Lit Protocol
CHRONICLE_YELLOWSTONE_RPC=https://yellowstone-rpc.litprotocol.com
# Lit Protocol's Chronicle Yellowstone RPC endpoint

VINCENT_DELEGATEE_PRIVATE_KEY=0x...
# Private key for the delegatee wallet that signs transactions
# KEEP THIS SECRET - never commit to version control

VINCENT_APP_ID=12345
# Your Vincent App ID from Lit Protocol

# Authentication
ALLOWED_AUDIENCE=http://localhost:5173
# JWT audience claim (your frontend URL)

# CORS
CORS_ALLOWED_DOMAIN=http://localhost:5173
# Allowed origin for CORS (your frontend URL)

# Server
PORT=3000
# Port for the API server to listen on

# Environment
IS_DEVELOPMENT=true
# Set to false in production
```

#### Optional Variables

```bash
# Alchemy Gas Sponsorship (recommended for production)
ALCHEMY_API_KEY=your-alchemy-api-key
ALCHEMY_POLICY_ID=your-gas-manager-policy-id

# Sentry Error Monitoring
SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=your-sentry-auth-token
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project

# Transaction Settings
DEFAULT_TX_CONFIRMATIONS=6
# Number of confirmations to wait for transactions (default: 6)
```

### Environment Variable Details

#### CONVEX_URL
Your Convex deployment URL. After creating a Convex project, you'll receive a URL like `https://happy-animal-123.convex.cloud`.

#### BASE_RPC_URL
RPC endpoint for Base network. Options:
- Public: `https://mainnet.base.org/`
- Alchemy: `https://base-mainnet.g.alchemy.com/v2/YOUR-API-KEY`
- QuickNode: Your dedicated endpoint URL

#### VINCENT_DELEGATEE_PRIVATE_KEY
Private key of the wallet that will sign transactions on behalf of users through Lit Protocol PKPs. This wallet needs:
- Small amount of ETH on Chronicle network for Lit Protocol operations
- Does NOT need funds on Base network if using gas sponsorship

**Security**: Never commit this to git. Store securely in production (e.g., AWS Secrets Manager, HashiCorp Vault).

#### VINCENT_APP_ID
Unique identifier for your Vincent app. Register at Lit Protocol to obtain one.

#### ALLOWED_AUDIENCE
JWT audience claim validation. Must match the `aud` claim in Vincent JWTs. Typically your frontend URL.

#### CORS_ALLOWED_DOMAIN
Origin allowed for CORS. In development, use your local frontend URL. In production, use your production frontend URL. For multiple domains, modify `src/lib/express/index.ts`.

#### IS_DEVELOPMENT
Controls CORS behavior:
- `true`: Allows all origins (development only)
- `false`: Strict CORS with CORS_ALLOWED_DOMAIN (production)

#### ALCHEMY_API_KEY & ALCHEMY_POLICY_ID
For gasless transactions. Create a Gas Manager policy in Alchemy dashboard:
1. Go to Alchemy dashboard
2. Navigate to Gas Manager
3. Create a new policy
4. Set spending rules and limits
5. Copy API key and policy ID

#### SENTRY Configuration
For production error monitoring:
1. Create Sentry project
2. Copy DSN from project settings
3. Generate auth token for sourcemap uploads
4. Configure org and project slugs

#### DEFAULT_TX_CONFIRMATIONS
Number of block confirmations to wait before considering a transaction finalized. Higher = more secure but slower. Base network typically finalizes quickly, so 6 confirmations provide good security.

## Running the Application

### Development Mode

Run with hot reload during development:

```bash
pnpm dev
```

This starts both the API server and job worker with automatic restart on file changes.

### Production Mode

#### Build First

```bash
pnpm build
```

#### Run Combined Server (API + Worker)

```bash
pnpm start
```

Runs both API server and job worker in a single process. Recommended for small to medium deployments.

#### Run API Server Only

```bash
pnpm startApiServer
```

Runs only the Express API server without the job worker. Use this when scaling horizontally with separate worker instances.

#### Run Job Worker Only

```bash
pnpm startWorker
```

Runs only the job worker without the API server. Deploy multiple worker instances for redundancy and load distribution.

### Other Commands

#### Testing

```bash
pnpm test
```

Runs Jest test suite.

#### Linting

```bash
pnpm lint
```

Checks code quality with ESLint.

#### Clean

```bash
pnpm clean
```

Removes `node_modules` and `dist` directories.

#### Mint Capacity Credit

```bash
pnpm mintRli
```

Utility command to mint a new Lit Protocol capacity credit NFT. Required for Lit Protocol operations on Datil network.

#### Upload Sourcemaps to Sentry

```bash
pnpm sentry:sourcemaps
```

Uploads sourcemaps to Sentry for better error tracking in production. Requires Sentry configuration.

## API Documentation

All endpoints require authentication with a Vincent JWT token in the `Authorization` header:

```
Authorization: Bearer <vincent-jwt-token>
```

The JWT must contain:
- Valid PKP information (ethAddress, publicKey, tokenId)
- App ID matching `VINCENT_APP_ID`
- Audience matching `ALLOWED_AUDIENCE`

### Base URL

```
http://localhost:3000
```

(Replace with your production URL)

### Endpoints

#### List Schedules

```http
GET /schedules
```

Returns all DCA schedules for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "schedule_id_123",
      "name": "Daily BTC Purchase",
      "purchaseAmount": 10,
      "purchaseIntervalHuman": "1 day",
      "purchaseIntervalMs": 86400000,
      "nextRunAt": 1698765432000,
      "lastRunAt": 1698679032000,
      "disabled": false,
      "failureCount": 0,
      "ethAddress": "0x...",
      "pkpPublicKey": "0x...",
      "pkpTokenId": "123",
      "appId": 12345,
      "appVersion": "1.0.0"
    }
  ]
}
```

#### Create Schedule

```http
POST /schedule
```

Creates a new DCA schedule.

**Request Body:**
```json
{
  "name": "Daily BTC Purchase",
  "purchaseAmount": 10,
  "purchaseIntervalHuman": "1 day"
}
```

**Parameters:**
- `name` (string, required): Human-readable name for the schedule
- `purchaseAmount` (number, required): Amount in USDC to purchase per interval
- `purchaseIntervalHuman` (string, required): Interval in human-readable format (e.g., "1 day", "3 hours", "1 week")

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "schedule_id_123",
    "name": "Daily BTC Purchase",
    "purchaseAmount": 10,
    "purchaseIntervalHuman": "1 day",
    "purchaseIntervalMs": 86400000,
    "nextRunAt": 1698765432000,
    "disabled": false,
    "failureCount": 0,
    "ethAddress": "0x...",
    "pkpPublicKey": "0x...",
    "pkpTokenId": "123",
    "appId": 12345,
    "appVersion": "1.0.0"
  }
}
```

#### Edit Schedule

```http
PUT /schedules/:scheduleId
```

Updates an existing schedule.

**Request Body:**
```json
{
  "name": "Daily BTC Purchase - Updated",
  "purchaseAmount": 15,
  "purchaseIntervalHuman": "2 days"
}
```

All fields are optional. Only provided fields will be updated.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "schedule_id_123",
    "name": "Daily BTC Purchase - Updated",
    "purchaseAmount": 15,
    "purchaseIntervalHuman": "2 days",
    "purchaseIntervalMs": 172800000,
    "nextRunAt": 1698851832000,
    "disabled": false,
    "failureCount": 0,
    "ethAddress": "0x...",
    "pkpPublicKey": "0x...",
    "pkpTokenId": "123",
    "appId": 12345,
    "appVersion": "1.0.0"
  }
}
```

#### Enable Schedule

```http
PUT /schedules/:scheduleId/enable
```

Enables a disabled schedule.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "schedule_id_123",
    "disabled": false,
    ...
  }
}
```

#### Disable Schedule

```http
PUT /schedules/:scheduleId/disable
```

Disables an active schedule. No more purchases will execute until re-enabled.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "schedule_id_123",
    "disabled": true,
    ...
  }
}
```

#### Delete Schedule

```http
DELETE /schedules/:scheduleId
```

Permanently deletes a schedule. This action cannot be undone.

**Response:**
```json
{
  "success": true
}
```

#### List Purchases

```http
GET /purchases
```

Returns purchase history for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "purchase_id_456",
      "_creationTime": 1698679032000,
      "ethAddress": "0x...",
      "coinAddress": "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c",
      "symbol": "wBTC",
      "purchaseAmount": "10.00",
      "txHash": "0x123abc...",
      "scheduleId": "schedule_id_123"
    }
  ]
}
```

### Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created (for POST /schedule)
- `400`: Bad request (invalid input)
- `401`: Unauthorized (invalid or missing JWT)
- `403`: Forbidden (JWT valid but not authorized for this resource)
- `404`: Not found
- `500`: Internal server error

## Database Schema

The application uses Convex as its real-time database. The schema is defined in `convex/schema.ts`.

### Tables

#### schedules

Stores DCA schedule configurations.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<'schedules'>` | Unique schedule identifier (auto-generated) |
| `_creationTime` | `number` | Timestamp when schedule was created (auto-generated) |
| `appId` | `number` | Vincent app ID |
| `appVersion` | `string` | Version of the app when created |
| `disabled` | `boolean` | Whether the schedule is active |
| `ethAddress` | `string` | User's PKP Ethereum address |
| `failureCount` | `number` | Consecutive failure count |
| `failureReason` | `string` (optional) | Last failure error message |
| `lastFailedAt` | `number` (optional) | Timestamp of last failure |
| `lastProcessedAt` | `number` (optional) | Timestamp of last successful execution |
| `lastRunAt` | `number` (optional) | Timestamp of last run attempt |
| `lockedAt` | `number` (optional) | Lock timestamp to prevent duplicate execution |
| `name` | `string` | User-defined schedule name |
| `nextRunAt` | `number` | Timestamp when next execution should occur |
| `pkpPublicKey` | `string` | PKP public key |
| `pkpTokenId` | `string` | PKP token ID |
| `purchaseAmount` | `number` | Amount in USDC per purchase |
| `purchaseIntervalHuman` | `string` | Human-readable interval (e.g., "1 day") |
| `purchaseIntervalMs` | `number` | Interval in milliseconds |
| `repeatInterval` | `string` | Same as purchaseIntervalHuman (legacy field) |

**Indexes:**
- `by_ethAddress`: Query schedules by user address
- `by_nextRunAt`: Find schedules due for execution
- `by_nextRunAt_and_disabled`: Find active schedules due for execution

#### purchasedCoins

Records executed purchases.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | `Id<'purchasedCoins'>` | Unique purchase identifier (auto-generated) |
| `_creationTime` | `number` | Timestamp when purchase was executed (auto-generated) |
| `coinAddress` | `string` | Token contract address purchased |
| `ethAddress` | `string` | User's PKP Ethereum address |
| `purchaseAmount` | `string` | Amount in USDC spent |
| `scheduleId` | `Id<'schedules'>` | Reference to originating schedule |
| `symbol` | `string` | Token symbol (e.g., "wBTC") |
| `txHash` | `string` (optional) | Transaction hash on Base network |

**Indexes:**
- `by_ethAddress`: Query purchases by user
- `by_scheduleId`: Query purchases for a specific schedule
- `by_ethAddress_and_createdAt`: Query user's purchases chronologically

### Queries and Mutations

#### Schedules

Defined in `convex/schedules.ts`:

- `listByEthAddress`: Get all schedules for a user
- `getById`: Get single schedule by ID
- `findByEthAddressAndId`: Get schedule with ownership check
- `create`: Create new schedule
- `update`: Update schedule fields
- `disable`: Disable a schedule
- `enable`: Enable a schedule
- `remove`: Delete a schedule
- `getDueSchedules`: Get all schedules ready for execution (internal)
- `lockSchedule`: Lock schedule during execution (internal)
- `unlockSchedule`: Unlock schedule after execution (internal)
- `updateAfterExecution`: Update schedule state after execution attempt (internal)

#### Purchases

Defined in `convex/purchases.ts`:

- `listByEthAddress`: Get all purchases for a user
- `create`: Record a new purchase (internal)

## Architecture

### System Components

The application consists of three main components that can be deployed together or separately:

#### 1. API Server (`src/lib/apiServer.ts`)

Express.js REST API that:
- Handles user requests to manage schedules
- Authenticates requests using Vincent JWT tokens
- Validates input with Zod schemas
- Communicates with Convex database
- Returns JSON responses

#### 2. Job Worker (`src/lib/convex/jobWorker.ts`)

Background process that:
- Polls Convex every 10 seconds for due schedules
- Executes DCA swaps through Lit Protocol
- Updates schedule state after execution
- Handles errors and retries
- Logs execution details

#### 3. Combined Server (`src/bin/serverWorker.ts`)

Runs both API server and job worker in a single process. Suitable for:
- Development
- Small deployments
- Single-instance production setups

### Execution Flow

#### Creating a Schedule

```
User → Frontend → API Server → Convex Database
                      ↓
              Validate JWT & Input
                      ↓
              Create Schedule Record
                      ↓
              Return Schedule to User
```

#### Executing a Purchase

```
Job Worker (10s interval)
    ↓
Query Convex for due schedules
    ↓
Lock schedule (prevent duplicate execution)
    ↓
Check user USDC balance
    ↓
Verify user permissions with Lit Protocol
    ↓
[If needed] Approve USDC to Uniswap Router
    ↓
Execute swap on Uniswap V3
    ↓
Record purchase in Convex
    ↓
Update schedule (nextRunAt, success/failure state)
    ↓
Unlock schedule
```

### Data Flow

```
User Request
    ↓
Express Middleware Chain
    ├── Helmet (security headers)
    ├── CORS
    ├── JSON parser
    ├── Vincent JWT validator
    ├── Sentry user context
    └── Route handler
        ↓
    Convex Client
        ↓
    Convex Database
        ↓
    Response to User
```

### Transaction Signing

```
Job Worker
    ↓
Vincent Tool Client (ERC20 Approval)
    ↓
Lit Protocol PKP Session
    ↓
Sign transaction with delegatee
    ↓
Broadcast to Base network
    ↓
[Optional] Alchemy Gas Sponsorship
    ↓
Wait for confirmations
    ↓
Return transaction hash
```

## Job Worker System

### Polling Mechanism

The job worker runs a continuous loop every 10 seconds (`src/lib/convex/jobWorker.ts`):

```typescript
setInterval(async () => {
  await processSchedules();
}, 10000); // 10 seconds
```

### Schedule Selection

Queries Convex for schedules where:
- `nextRunAt <= current time`
- `disabled = false`
- Not locked OR locked more than 5 minutes ago (stale lock cleanup)

### Locking

Before executing a schedule, it's locked to prevent duplicate execution by other worker instances:

```typescript
await convex.mutation(api.schedules.lockSchedule, { scheduleId });
```

Lock is released after execution completes (success or failure).

### Execution Process

For each due schedule:

1. **Lock Schedule**: Prevent other workers from processing
2. **Check Balance**: Verify sufficient USDC
3. **Check Permissions**: Ensure user hasn't revoked app access
4. **Version Check**: Use latest permitted app version
5. **Approve USDC**: If allowance insufficient (5x purchase amount for gas efficiency)
6. **Get Uniswap Quote**: Fetch current swap rate
7. **Execute Swap**: Send transaction through Lit Protocol PKP
8. **Wait for Confirmation**: Monitor transaction until confirmed
9. **Record Purchase**: Save to Convex database
10. **Update Schedule**: Set next run time, clear failures
11. **Unlock Schedule**: Allow future processing

### Error Handling

Failures are categorized:

#### Retriable Errors
- Network timeouts
- Temporary RPC errors
- Slippage issues

Action: Increment `failureCount`, keep schedule enabled, retry on next poll.

#### Non-Retriable Errors
- Insufficient balance
- Insufficient gas
- Out of gas errors

Action: Automatically disable schedule to prevent repeated failures.

### Failure Tracking

Each schedule tracks:
- `failureCount`: Number of consecutive failures
- `failureReason`: Error message from last failure
- `lastFailedAt`: Timestamp of last failure

Reset to zero on successful execution.

### Concurrent Execution

Multiple worker instances can run simultaneously:
- Locking prevents duplicate execution
- Each worker independently polls and processes
- Recommended: 2-3 workers for redundancy
- Convex handles concurrent access safely

## Lit Protocol Integration

### PKP (Programmable Key Pair)

PKPs are non-custodial key pairs controlled by Lit Protocol's network. Users can:
- Generate PKPs without holding private keys
- Grant permission to apps to sign transactions
- Revoke permissions at any time

### Vincent Framework

Vincent is Lit Protocol's framework for building apps with PKPs. Key concepts:

#### Vincent App
- Registered application with unique App ID
- Users grant permissions to specific app versions
- Apps request signatures through Lit Protocol network

#### Delegatee
- Wallet that submits signature requests to Lit Protocol
- Configured via `VINCENT_DELEGATEE_PRIVATE_KEY`
- Needs small amount of LIT tokens for operations
- Does NOT control user funds

#### Vincent Tools
Modular abilities that apps can use:
- **ERC20 Approval Tool**: Approve token spending
- **Uniswap Tool**: Execute swaps
- Tools enforce permissions and safety checks

### Authentication Flow

1. User authenticates with frontend
2. Frontend generates Vincent JWT signed by PKP
3. JWT contains:
   - PKP information (ethAddress, publicKey, tokenId)
   - App ID and version
   - Expiration time
   - Audience claim
4. Backend validates JWT signature and claims
5. If valid, request is associated with PKP

### Capacity Credits

Lit Protocol's Datil network requires capacity credits for operations. They define:
- Requests per kilosecond (rate limit)
- Expiration date

#### Minting Capacity Credits

```bash
pnpm mintRli
```

This command:
- Connects to Lit Protocol
- Calculates cost in LIT tokens
- Mints a capacity credit NFT
- Returns capacity token ID

Default settings:
- 100 requests per kilosecond
- 30 days expiration

Modify in `src/mintRLINft.ts` or `src/lib/utils/mintCapacityCredit.ts`.

### Permission Management

Users control which app versions can sign transactions for their PKP. The system:

1. Checks permitted version before execution
2. If user upgraded permission, uses new version
3. If permission revoked, disables schedule
4. Automatically updates schedule with new version

### Security Model

- **Non-Custodial**: Users always control their PKPs
- **Permissioned**: Apps can only act within granted permissions
- **Revocable**: Users can revoke access anytime
- **Auditable**: All actions recorded on-chain and in database

## Security Considerations

### Private Key Management

**VINCENT_DELEGATEE_PRIVATE_KEY** is the most sensitive credential:

- Store in secure key management system (AWS Secrets Manager, HashiCorp Vault)
- Never commit to version control
- Rotate regularly
- Use separate keys for development and production
- Limit access to key to minimum necessary personnel

### JWT Validation

All API requests must include valid Vincent JWT:

- Signature verification ensures PKP ownership
- Audience claim prevents token replay across domains
- Expiration enforced
- App ID checked to prevent cross-app usage

### CORS Configuration

In production:
- Set `IS_DEVELOPMENT=false`
- Configure `CORS_ALLOWED_DOMAIN` to your frontend URL only
- Never use `*` wildcard in production

For multiple domains, modify `src/lib/express/index.ts`:

```typescript
const corsConfig = {
  origin: [
    'https://app.example.com',
    'https://app2.example.com'
  ],
  optionsSuccessStatus: 204,
};
```

### HTTP Security Headers

Helmet middleware adds security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- And more

### Input Validation

All API inputs validated with Zod schemas (`src/lib/express/schema.ts`):
- Type checking
- Format validation
- Required field enforcement
- Prevents injection attacks

### Database Security

Convex provides:
- Authentication on all requests
- Input sanitization
- Row-level security through queries
- Automatic injection prevention

### Error Monitoring

Sentry configuration:
- Scrubs sensitive data from error reports
- User context limited to ethAddress (no private keys)
- Stack traces for debugging
- Never log private keys or JWT tokens

### Gas Sponsorship Security

When using Alchemy Gas Manager:
- Set spending limits on policy
- Monitor usage regularly
- Restrict to specific contract addresses
- Set up alerts for unusual activity

### Best Practices

1. **Secrets**: Use environment variables, never hardcode
2. **HTTPS**: Always use HTTPS in production
3. **Rate Limiting**: Consider adding rate limiting for API endpoints
4. **Monitoring**: Set up alerts for failed transactions
5. **Backups**: Regular Convex database backups
6. **Updates**: Keep dependencies updated for security patches
7. **Audit Logs**: Review Sentry logs regularly
8. **Access Control**: Limit production environment access

## Deployment

### Deployment Options

#### 1. Traditional VPS (AWS EC2, DigitalOcean, etc.)

**Pros**: Full control, cost-effective for larger deployments
**Cons**: Requires more setup and maintenance

**Steps**:
1. Provision server with Node.js 22.16.0
2. Install pnpm
3. Clone repository
4. Configure environment variables
5. Build project: `pnpm build`
6. Set up process manager (PM2 or systemd)
7. Configure reverse proxy (Nginx or Caddy)
8. Set up SSL certificate (Let's Encrypt)

#### 2. Platform as a Service (Railway, Render, Fly.io)

**Pros**: Easy deployment, automatic scaling, built-in monitoring
**Cons**: Higher cost for larger scale

**Steps**:
1. Connect GitHub repository
2. Configure environment variables in dashboard
3. Set build command: `pnpm build`
4. Set start command: `pnpm start`
5. Deploy

#### 3. Container Platform (AWS ECS, Google Cloud Run, Azure Container Instances)

**Pros**: Highly scalable, reproducible deployments
**Cons**: More complex setup

**Steps**:
1. Create Dockerfile (example below)
2. Build container image
3. Push to container registry
4. Deploy to container platform
5. Configure environment variables
6. Set up load balancer and auto-scaling

### Example Dockerfile

```dockerfile
FROM node:22.16.0-alpine

# Install pnpm
RUN npm install -g pnpm@10.7.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy source
COPY . .

# Build
RUN pnpm build

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "dist/bin/serverWorker.mjs"]
```

### Production Checklist

Before deploying to production:

- [ ] Set `IS_DEVELOPMENT=false`
- [ ] Configure production `CORS_ALLOWED_DOMAIN`
- [ ] Set secure `VINCENT_DELEGATEE_PRIVATE_KEY`
- [ ] Configure Sentry with production DSN
- [ ] Set up Alchemy gas sponsorship with spending limits
- [ ] Configure production Convex database
- [ ] Set appropriate `DEFAULT_TX_CONFIRMATIONS`
- [ ] Test all API endpoints
- [ ] Verify job worker executes schedules
- [ ] Set up monitoring and alerts
- [ ] Configure log aggregation
- [ ] Set up database backups
- [ ] Document runbook for common issues
- [ ] Configure auto-restart on crashes
- [ ] Set up health check endpoint
- [ ] Configure appropriate resource limits
- [ ] Set up horizontal scaling if needed

### Scaling Considerations

#### Vertical Scaling
- Start with 2 CPU cores, 2GB RAM
- Monitor CPU and memory usage
- Scale up if consistently above 70% utilization

#### Horizontal Scaling

**API Servers**:
- Stateless, easily scalable
- Add more instances behind load balancer
- Each instance handles independent requests

**Job Workers**:
- Can run multiple instances
- Convex locking prevents duplicate execution
- Recommended: 2-3 workers for redundancy
- More workers = faster processing of due schedules

**Database**:
- Convex handles scaling automatically
- Monitor query performance
- Add indexes if needed

### Monitoring

Set up monitoring for:

**Application Metrics**:
- Request rate and latency
- Error rate
- Schedule execution success rate
- Job processing time
- Active schedules count

**System Metrics**:
- CPU usage
- Memory usage
- Disk I/O
- Network traffic

**Business Metrics**:
- Total purchases executed
- Average purchase amount
- User retention
- Failed schedules
- Gas costs

**Alerting**:
- High error rate
- Failed schedule executions
- Low delegatee wallet balance
- Expired capacity credits
- High gas costs
- Database query timeouts

### Backup Strategy

**Convex Database**:
- Convex provides automatic backups
- Test restore procedure regularly
- Document recovery steps

**Configuration**:
- Store `.env` securely (not in repository)
- Keep backup of environment variables
- Document all infrastructure as code

### Disaster Recovery

Plan for:
- Database corruption or loss
- Service outage
- Security breach
- Loss of delegatee private key
- DNS or domain issues
- Third-party service outages (Alchemy, Lit Protocol)

Document:
- Recovery time objective (RTO)
- Recovery point objective (RPO)
- Step-by-step recovery procedures
- Emergency contacts
- Escalation procedures

## Development

### Local Development Setup

1. Install dependencies: `pnpm install`
2. Configure `.env` for development
3. Start development server: `pnpm dev`
4. Server runs at `http://localhost:3000`
5. Hot reload enabled for code changes

### Code Quality

#### TypeScript

Strict type checking enabled:
- `strictNullChecks: true`
- No implicit any
- Full type coverage

#### ESLint

Run linter:
```bash
pnpm lint
```

Fix auto-fixable issues:
```bash
pnpm lint --fix
```

#### Testing

Run tests:
```bash
pnpm test
```

Run tests in watch mode:
```bash
pnpm test --watch
```

Run tests with coverage:
```bash
pnpm test --coverage
```

### Project Scripts Explained

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `pnpm tsx watch src/bin/serverWorker.ts` | Development with hot reload |
| `build` | `pnpm unbuild` | Production build |
| `start` | `node ./dist/bin/serverWorker.mjs` | Run production combined server |
| `startWorker` | `node ./dist/bin/jobWorker.mjs` | Run production worker only |
| `startApiServer` | `node ./dist/bin/apiServer.mjs` | Run production API only |
| `test` | `pnpm jest` | Run tests |
| `lint` | `pnpm eslint ./src` | Check code quality |
| `clean` | Remove node_modules and dist | Clean build artifacts |
| `mintRli` | `pnpm tsx ./src/bin/mintRLINft.ts` | Mint capacity credit |

### Adding New Features

#### Adding a New API Endpoint

1. **Define Route Handler** in `src/lib/express/schedules.ts` or create new file:
```typescript
export const handleMyNewRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  // Your logic here
  res.json({ success: true, data: result });
};
```

2. **Register Route** in `src/lib/express/index.ts`:
```typescript
app.get('/my-route', middleware, setSentryUserMiddleware, handler(handleMyNewRoute));
```

3. **Add Validation Schema** in `src/lib/express/schema.ts` if needed:
```typescript
export const MyRequestSchema = z.object({
  field: z.string(),
});
```

#### Adding a New Database Table

1. **Update Schema** in `convex/schema.ts`:
```typescript
myNewTable: defineTable({
  field1: v.string(),
  field2: v.number(),
}).index('by_field1', ['field1']),
```

2. **Create Queries/Mutations** in `convex/myNewTable.ts`:
```typescript
export const listItems = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('myNewTable').collect();
  },
});
```

3. **Deploy Schema** to Convex

#### Modifying Job Logic

Core swap logic is in `src/lib/convex/executeDCASwap.ts`. Key functions:

- `executeDCASwap()`: Main execution function
- `addUsdcApproval()`: Handles ERC20 approval
- `handleSwapExecution()`: Executes Uniswap swap

Make changes carefully and test thoroughly in development before deploying.

### Testing HTTP Endpoints

Sample HTTP requests are in `src/testHttp/`:
- `list_schedules.http`
- `create_schedule.http`
- `edit_schedule.http`
- `enable_schedule.http`
- `disable_schedule.http`
- `delete_schedule.http`

Use with REST clients like:
- VS Code REST Client extension
- Postman
- Insomnia
- curl

### Debugging

Enable verbose logging:
```typescript
consola.level = 5; // In src/lib/logger.ts
```

View Sentry errors:
1. Go to Sentry dashboard
2. Select your project
3. View Issues tab
4. Filter by environment

Check Convex logs:
1. Go to Convex dashboard
2. Select your project
3. View Logs tab
4. Filter by function name

### Contributing Guidelines

If contributing to this project:

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Run linter and fix issues
6. Update documentation
7. Submit pull request with clear description

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Convex client not initialized"

**Cause**: `CONVEX_URL` not set or invalid

**Solution**:
1. Check `.env` file has `CONVEX_URL`
2. Verify URL format: `https://your-project.convex.cloud`
3. Ensure Convex project is deployed
4. Restart server after changing `.env`

#### Issue: "JWT validation failed"

**Cause**: Invalid or expired Vincent JWT token

**Solution**:
1. Verify token includes required claims
2. Check `ALLOWED_AUDIENCE` matches JWT `aud` claim
3. Ensure `VINCENT_APP_ID` matches JWT app ID
4. Check token hasn't expired
5. Verify PKP signature is valid

#### Issue: "Not enough balance for account"

**Cause**: User's PKP wallet has insufficient USDC

**Solution**:
1. User needs to deposit USDC to their PKP address
2. Check balance on Base network block explorer
3. Ensure user is checking correct address (PKP address, not personal wallet)
4. Schedule will auto-disable to prevent repeated failures

#### Issue: "User revoked permission to run this app"

**Cause**: User removed permission for this Vincent app version

**Solution**:
1. User needs to re-grant permission in frontend
2. Check Lit Protocol dashboard for active permissions
3. Verify app version matches user's granted version
4. Schedule will not execute until permission restored

#### Issue: "Failed to execute swap"

**Cause**: Various Uniswap or network issues

**Solution**:
1. Check Base network status
2. Verify Uniswap router address is correct
3. Check slippage tolerance (might need adjustment)
4. Ensure sufficient liquidity in Uniswap pool
5. Check transaction in Base block explorer for specific error

#### Issue: "Gas estimation failed"

**Cause**: Transaction simulation failed

**Solution**:
1. Check USDC approval is sufficient
2. Verify Alchemy gas sponsorship is configured
3. Check delegatee wallet has ETH (if not using gas sponsorship)
4. Verify contract addresses are correct
5. Check network congestion

#### Issue: "Capacity credit expired"

**Cause**: Lit Protocol capacity credit NFT expired

**Solution**:
1. Run `pnpm mintRli` to mint new capacity credit
2. Ensure delegatee wallet has LIT tokens
3. Update capacity credit tracking
4. Consider minting longer duration credits

#### Issue: Job worker not processing schedules

**Cause**: Worker not running or configuration issue

**Solution**:
1. Check worker process is running
2. Verify Convex connection
3. Check logs for errors
4. Ensure schedules have `nextRunAt` in past
5. Verify schedules are not disabled
6. Check for stale locks (> 5 minutes)

#### Issue: High failure rate

**Cause**: Various execution issues

**Solution**:
1. Check Sentry for specific error patterns
2. Verify network connectivity to Base RPC
3. Check Lit Protocol network status
4. Monitor Alchemy spending limits
5. Review failed transaction details
6. Consider adjusting confirmation count

#### Issue: CORS errors in frontend

**Cause**: CORS misconfiguration

**Solution**:
1. Verify `CORS_ALLOWED_DOMAIN` matches frontend URL
2. Check `IS_DEVELOPMENT` setting
3. Ensure frontend sends credentials correctly
4. Check browser console for specific CORS error
5. Verify OPTIONS preflight requests succeed

## Customization

### Changing Target Token

Default: USDC → wBTC on Base network

To change target token (e.g., to ETH or another token):

1. **Update Constants** in `src/lib/convex/executeDCASwap.ts`:
```typescript
const BASE_TARGET_TOKEN_ADDRESS = '0xYourTokenAddress';
const TARGET_TOKEN_SYMBOL = 'ETH'; // or your token symbol
```

2. **Update Purchase Recording**:
```typescript
await convex.mutation(api.purchases.create, {
  // ...
  coinAddress: BASE_TARGET_TOKEN_ADDRESS,
  symbol: TARGET_TOKEN_SYMBOL,
  // ...
});
```

3. **Test Thoroughly**: Different tokens may have different decimals, liquidity, and swap parameters

### Changing Source Token

Default: USDC (6 decimals)

To change from USDC to another stablecoin:

1. **Update Token Address**:
```typescript
const BASE_SOURCE_TOKEN_ADDRESS = '0xYourTokenAddress';
```

2. **Update Decimals**:
```typescript
const SOURCE_TOKEN_DECIMALS = 18; // or appropriate decimals
```

3. **Update ERC20 Contract**:
```typescript
const sourceTokenContract = getERC20Contract(BASE_SOURCE_TOKEN_ADDRESS, baseProvider);
```

4. **Update Approval Logic**: Ensure approval uses correct token address

### Changing Blockchain Network

Default: Base (chain ID 8453)

To deploy on another EVM chain:

1. **Update RPC URL** in `.env`:
```bash
BASE_RPC_URL=https://your-network-rpc.com/
```

2. **Update Chain ID** in `src/lib/convex/executeDCASwap.ts`:
```typescript
const CHAIN_ID = 1; // or your chain ID
```

3. **Update Contract Addresses**: Token addresses and Uniswap router vary by chain

4. **Update Gas Sponsorship**: Configure for target network or disable

5. **Test Thoroughly**: Each chain has different characteristics

### Adjusting Polling Interval

Default: 10 seconds

To change job worker polling frequency:

In `src/lib/convex/jobWorker.ts`:
```typescript
setInterval(async () => {
  await processSchedules();
}, 5000); // Change to desired milliseconds
```

**Considerations**:
- Lower interval = more responsive but higher load
- Higher interval = lower load but less responsive
- Balance based on your needs and scale

### Customizing Transaction Confirmations

Default: 6 confirmations

To change in `.env`:
```bash
DEFAULT_TX_CONFIRMATIONS=12
```

**Considerations**:
- More confirmations = more secure but slower
- Base network finalizes quickly, so 6 is usually sufficient
- For high-value transactions, consider more confirmations

### Adding Custom Metrics

To add custom tracking:

1. **Extend Database Schema** in `convex/schema.ts`
2. **Record Metrics** in appropriate functions
3. **Create Queries** to retrieve metrics
4. **Add API Endpoint** to expose metrics

Example: Track total volume:
```typescript
export const getTotalVolume = query({
  args: {},
  handler: async (ctx) => {
    const purchases = await ctx.db.query('purchasedCoins').collect();
    return purchases.reduce((sum, p) => sum + parseFloat(p.purchaseAmount), 0);
  },
});
```

### Adding Notification System

To notify users of executions:

1. **Choose Provider**: Email (SendGrid), SMS (Twilio), Push (Firebase)
2. **Store Notification Preferences**: Add to schedules table
3. **Send Notifications**: After successful execution in `executeDCASwap()`
4. **Handle Failures**: Notify on repeated failures

Example structure:
```typescript
if (notificationsEnabled) {
  await sendNotification({
    userId: ethAddress,
    type: 'purchase_success',
    data: { amount, token, txHash }
  });
}
```

## License

This project is private and not licensed for public use. All rights reserved by LIT Protocol.

For licensing inquiries, contact: [LIT Protocol](https://github.com/LIT-Protocol)

---

## Additional Resources

### Documentation Links

- [Lit Protocol Documentation](https://developer.litprotocol.com/)
- [Vincent App SDK](https://github.com/LIT-Protocol/js-sdk)
- [Convex Documentation](https://docs.convex.dev/)
- [Uniswap V3 Documentation](https://docs.uniswap.org/)
- [Base Network Documentation](https://docs.base.org/)
- [Alchemy Documentation](https://docs.alchemy.com/)
- [Express.js Documentation](https://expressjs.com/)

### Support

For issues and questions:
- GitHub Issues: [vincent-dca repository](https://github.com/LIT-Protocol/vincent-dca/issues)
- Lit Protocol Discord: [Join here](https://litprotocol.com/discord)

### Version History

- **v1.0.0**: Initial release with Base network support
  - DCA scheduling
  - USDC to wBTC swaps
  - Vincent authentication
  - Alchemy gas sponsorship
  - Convex database integration

---

Built with by LIT Protocol
