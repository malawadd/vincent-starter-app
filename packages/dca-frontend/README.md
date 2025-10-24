# Vincent DCA Frontend

A React-based frontend application for the Vincent DCA (Dollar-Cost Averaging) platform. This application allows users to create, manage, and monitor automated wBTC purchases using USDC on the Base network, powered by the Vincent platform for secure, delegated execution.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Vincent Authentication Flow](#vincent-authentication-flow)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Key Components](#key-components)
- [Styling](#styling)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Overview

The Vincent DCA frontend is a modern React application that provides a user-friendly interface for setting up and managing automated cryptocurrency purchases. It leverages the Vincent platform to enable secure, permissioned execution of DCA strategies without requiring users to trust the application with their private keys.

### Key Benefits

- **Secure Authentication**: Uses Vincent's delegated authentication system
- **Non-custodial**: Users maintain control of their funds through agent wallets
- **Automated Execution**: DCA tasks run automatically on predefined schedules
- **Transparent Operations**: All transactions are verifiable on-chain
- **User-friendly Interface**: Intuitive design for easy DCA management

## Technology Stack

- **React 19**: Modern React with latest features and optimizations
- **TypeScript**: Type-safe development with enhanced IDE support
- **Vite**: Fast build tool with instant HMR and optimized production builds
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Shadcn UI**: High-quality, accessible component library
- **Vincent App SDK**: Official SDK for Vincent platform integration
- **Ethers.js**: Ethereum blockchain interaction library
- **Storybook**: Component development and documentation tool

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Generic UI components (buttons, inputs, etc.)
│   ├── active-dcas.tsx  # DCA schedule management table
│   ├── create-dca.tsx   # DCA creation form
│   ├── wallet.tsx       # Wallet information and actions
│   └── ...
├── config/              # Configuration files
│   └── env.ts          # Environment variable validation
├── hooks/               # Custom React hooks
│   ├── useBackend.ts   # API interaction hook
│   └── useChain.ts     # Blockchain data hook
├── lib/                 # Utility functions
│   ├── utils.ts        # General utilities
│   └── zendesk.ts      # Support widget integration
├── pages/               # Top-level page components
│   ├── home.tsx        # Main authenticated view
│   └── login.tsx       # Authentication entry point
├── stories/             # Storybook component stories
└── App.tsx             # Main application component
```

## Key Features

### 1. DCA Management
- Create new DCA schedules with custom amounts and frequencies
- View all active and inactive DCA tasks
- Edit existing DCA parameters
- Enable/disable DCA schedules
- Delete unwanted DCA tasks

### 2. Wallet Integration
- Display agent wallet address and balances
- Support for ETH, USDC, and wBTC on Base network
- QR code generation for easy deposits
- Direct links to block explorers
- Integration with deBridge for cross-chain deposits

### 3. Real-time Updates
- Live balance refreshing
- DCA execution status monitoring
- Transaction history tracking
- Error handling and user notifications

### 4. Responsive Design
- Mobile-first responsive layout
- Optimized for all screen sizes
- Touch-friendly interface
- Accessible design patterns

## Vincent Authentication Flow

The application uses Vincent's secure authentication system:

### 1. Initial Access
- User visits the application
- `JwtProvider` checks for existing authentication
- If not authenticated, shows login page

### 2. Authentication Process
```typescript
// User clicks "Connect with Vincent"
const getJwt = useCallback(() => {
  vincentWebAuthClient.redirectToConnectPage({
    redirectUri: VITE_REDIRECT_URI,
  });
}, [vincentWebAuthClient]);
```

### 3. Vincent Consent
- User is redirected to Vincent platform
- Grants permissions for the DCA application
- Vincent issues a JWT with user's PKP information

### 4. Return to Application
- Vincent redirects back with JWT
- `JwtProvider` captures and validates the JWT
- Application state updates to authenticated

### 5. API Requests
```typescript
// All backend requests include the JWT
const sendRequest = async (endpoint: string, method: HTTPMethod, body?: unknown) => {
  const headers = {
    Authorization: `Bearer ${authInfo.jwt}`,
    'Content-Type': 'application/json',
  };
  // ... rest of request logic
};
```

## Environment Variables

Create a `.env` file in the frontend directory with the following variables:

```bash
# Vincent Configuration
VITE_APP_ID=your_vincent_app_id
VITE_REDIRECT_URI=http://localhost:5173
VITE_EXPECTED_AUDIENCE=http://localhost:5173

# Backend Configuration
VITE_BACKEND_URL=http://localhost:3000

# Development Settings
VITE_IS_DEVELOPMENT=true

# Optional: Error Tracking
VITE_SENTRY_DSN=your_sentry_dsn
VITE_SENTRY_FILTER=dca-frontend
```

## Getting Started

### Prerequisites
- Node.js ^22.16.0
- pnpm 10.7.0
- A Vincent App ID (create one at [Vincent Dashboard](https://dashboard.heyvincent.ai/))

### Installation

1. **Clone the repository and install dependencies:**
   ```bash
   # From the monorepo root
   pnpm install
   pnpm build
   ```

2. **Configure environment variables:**
   ```bash
   cd packages/dca-frontend
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the development server:**
   ```bash
   pnpm dev
   ```

The application will be available at `http://localhost:5173`.

## Development

### Available Scripts

- `pnpm dev` - Start development server with HMR
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build locally
- `pnpm lint` - Run ESLint
- `pnpm storybook` - Start Storybook development server
- `pnpm build-storybook` - Build Storybook for deployment

### Development Workflow

1. **Component Development**: Use Storybook for isolated component development
2. **Type Safety**: Leverage TypeScript for compile-time error checking
3. **Hot Reloading**: Vite provides instant feedback during development
4. **Linting**: ESLint ensures code quality and consistency

### Adding New Components

1. Create the component in the appropriate directory
2. Add TypeScript interfaces for props
3. Include Storybook stories for documentation
4. Export from the appropriate index file

Example:
```typescript
// components/ui/my-component.tsx
interface MyComponentProps {
  title: string;
  onClick: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onClick }) => {
  return (
    <button onClick={onClick} className="px-4 py-2 bg-blue-500 text-white rounded">
      {title}
    </button>
  );
};
```

## Building for Production

### Build Process
```bash
pnpm build
```

This creates an optimized production build in the `dist/` directory with:
- Minified JavaScript and CSS
- Tree-shaken dependencies
- Optimized assets
- Source maps for debugging

### Build Configuration
The build is configured in `vite.config.ts` with:
- React plugin with Babel compiler optimizations
- Tailwind CSS integration
- Path aliases for clean imports
- Sentry integration for error tracking
- Buffer polyfill for blockchain libraries

## Key Components

### Authentication Components
- **`Presentation`**: Landing page with "Connect with Vincent" button
- **`JwtProvider`**: Manages authentication state throughout the app

### DCA Management Components
- **`CreateDCA`**: Form for creating new DCA schedules
- **`ActiveDcas`**: Table displaying all DCA schedules with management actions
- **`DialogueEditDCA`**: Modal for editing existing DCA parameters

### Wallet Components
- **`Wallet`**: Displays wallet information and balances
- **`WalletModal`**: QR code modal for deposits

### UI Components
- **`Header`**: Application header with navigation
- **`Footer`**: Application footer with links
- **`PageHeader`**: Consistent page title component
- **`Button`**: Customizable button component with variants

## Styling

### Tailwind CSS
The application uses Tailwind CSS for styling with:
- Custom color palette matching Vincent branding
- Responsive design utilities
- Dark mode support (configured but not actively used)
- Custom font integration (Poppins and Encode Sans Semi Expanded)

### Component Styling
```typescript
// Example of component styling
<Button 
  variant="primary" 
  size="lg"
  className="w-full sm:w-auto"
>
  Create DCA →
</Button>
```

### Custom CSS Variables
```css
:root {
  --footer-text-color: #121212;
  --radius: 0.625rem;
  /* Additional custom properties */
}
```

## Testing

### Storybook
Components are documented and tested in Storybook:
```bash
pnpm storybook
```

### Component Stories
Each component includes stories for different states:
```typescript
// Example story
export const Default: Story = {
  args: {
    title: 'Vincent DCA Agent',
    subtitle: 'Early Access',
  },
};
```

## Deployment

### Environment-Specific Builds
- **Development**: Local development with HMR
- **Staging**: Preview builds for testing
- **Production**: Optimized builds with error tracking

### Deployment Platforms
The application can be deployed to:
- Vercel (recommended for React apps)
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

### Deployment Configuration
Ensure environment variables are properly configured for each environment:
- Update `VITE_BACKEND_URL` to point to production backend
- Set `VITE_REDIRECT_URI` to production domain
- Configure Sentry for error tracking in production

## Contributing

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Include proper type definitions
- Add Storybook stories for new components

### Pull Request Process
1. Create a feature branch from `main`
2. Make your changes with proper TypeScript types
3. Add or update tests/stories as needed
4. Ensure the build passes
5. Submit a pull request with a clear description

### Development Guidelines
- Keep components small and focused
- Use custom hooks for reusable logic
- Follow React best practices
- Maintain consistent styling patterns

## Support

For questions or issues:
- Check the [Vincent Documentation](https://docs.heyvincent.ai/)
- Join the [Telegram Support Channel](https://t.me/+aa73FAF9Vp82ZjJh)
- Review the [GitHub Issues](https://github.com/LIT-Protocol/vincent-dca/issues)

## License

This project is part of the Vincent DCA demo application. See the main repository for license information.