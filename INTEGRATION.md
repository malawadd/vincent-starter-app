# Vincent Frontend Integration Guide

This guide provides comprehensive instructions for integrating Vincent authentication and delegated execution into any React frontend application.

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Step-by-Step Integration](#step-by-step-integration)
- [Advanced Configuration](#advanced-configuration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)
- [Examples](#examples)

## Overview

Vincent, powered by Lit Protocol, enables secure, delegated execution of on-chain operations. Users can grant your application permission to perform specific blockchain actions on their behalf without exposing their private keys to your application.

### Key Benefits

- **Non-custodial**: Users maintain control of their funds through agent wallets
- **Secure**: Private keys never leave the user's control
- **Delegated**: Applications can execute pre-approved actions automatically
- **Verifiable**: All operations are cryptographically enforced and auditable

## Core Concepts

### 1. PKP (Programmable Key Pair)
A blockchain-agnostic key pair managed by the Lit Network. Users delegate control of their PKP to your Vincent App for specific operations.

### 2. Vincent App
Your application registered with the Vincent platform that defines specific on-chain "abilities" (e.g., ERC20 transfers, DEX swaps) that users can delegate.

### 3. Delegated Execution
Users grant your Vincent App permission to use their PKP to execute specific abilities. This delegation is cryptographically enforced by the Lit Network.

### 4. JWT Authentication
After delegation, Vincent issues a JWT containing user PKP information and granted permissions, which your frontend uses to authenticate with your backend.

## Prerequisites

Before integrating Vincent, ensure you have:

1. **Vincent App Registration**: Register your app at [Vincent Dashboard](https://dashboard.heyvincent.ai/)
2. **App ID**: Obtain your unique Vincent App ID
3. **Backend API**: A backend service that can validate Vincent JWTs
4. **React Application**: A React-based frontend (supports React 16.8+)

## Installation

Install the Vincent App SDK:

```bash
# Using pnpm (recommended)
pnpm add @lit-protocol/vincent-app-sdk

# Using npm
npm install @lit-protocol/vincent-app-sdk

# Using yarn
yarn add @lit-protocol/vincent-app-sdk
```

## Step-by-Step Integration

### Step 1: Environment Configuration

Create environment variables for your Vincent configuration:

```bash
# .env (for Vite projects)
VITE_VINCENT_APP_ID=your_app_id_here
VITE_REDIRECT_URI=http://localhost:3000
VITE_BACKEND_API_URL=http://localhost:8000

# .env.local (for Next.js projects)
NEXT_PUBLIC_VINCENT_APP_ID=your_app_id_here
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
```

Create a configuration file to manage these variables:

```typescript
// src/config/env.ts
export const config = {
  vincentAppId: parseInt(import.meta.env.VITE_VINCENT_APP_ID || process.env.NEXT_PUBLIC_VINCENT_APP_ID),
  redirectUri: import.meta.env.VITE_REDIRECT_URI || process.env.NEXT_PUBLIC_REDIRECT_URI,
  backendApiUrl: import.meta.env.VITE_BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL,
};
```

### Step 2: Setup Authentication Provider

Wrap your application with the `JwtProvider` to manage authentication state:

```typescript
// src/App.tsx
import React from 'react';
import { JwtProvider } from '@lit-protocol/vincent-app-sdk/react';
import { config } from './config/env';
import AppContent from './AppContent';

function App() {
  return (
    <JwtProvider appId={config.vincentAppId}>
      <AppContent />
    </JwtProvider>
  );
}

export default App;
```

### Step 3: Create Authentication Logic

Create a component to handle authentication state and routing:

```typescript
// src/AppContent.tsx
import React from 'react';
import { useJwtContext } from '@lit-protocol/vincent-app-sdk/react';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import LoadingSpinner from './components/LoadingSpinner';

function AppContent() {
  const { authInfo, isLoading } = useJwtContext();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen">
      {authInfo ? <HomePage /> : <LoginPage />}
    </div>
  );
}

export default AppContent;
```

### Step 4: Implement Login Component

Create a login component that initiates the Vincent authentication flow:

```typescript
// src/pages/LoginPage.tsx
import React from 'react';
import { useVincentWebAuthClient } from '@lit-protocol/vincent-app-sdk/react';
import { config } from '../config/env';

function LoginPage() {
  const vincentWebAuthClient = useVincentWebAuthClient(config.vincentAppId);

  const handleConnect = () => {
    vincentWebAuthClient.redirectToConnectPage({
      redirectUri: config.redirectUri,
      // Optional: customize consent page
      // consentPageUrl: 'https://dashboard.heyvincent.ai/connect'
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to Your App
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Connect with Vincent to get started
          </p>
        </div>
        <div>
          <button
            onClick={handleConnect}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Connect with Vincent
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
```

### Step 5: Create Authenticated Home Page

Build your main application interface for authenticated users:

```typescript
// src/pages/HomePage.tsx
import React from 'react';
import { useJwtContext } from '@lit-protocol/vincent-app-sdk/react';
import UserInfo from '../components/UserInfo';
import LogoutButton from '../components/LogoutButton';

function HomePage() {
  const { authInfo } = useJwtContext();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Your App Dashboard
          </h1>
          <LogoutButton />
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <UserInfo authInfo={authInfo} />
          {/* Add your main application content here */}
        </div>
      </main>
    </div>
  );
}

export default HomePage;
```

### Step 6: Display User Information

Create a component to display authenticated user information:

```typescript
// src/components/UserInfo.tsx
import React from 'react';

interface UserInfoProps {
  authInfo: any; // Type this according to your needs
}

function UserInfo({ authInfo }: UserInfoProps) {
  if (!authInfo) return null;

  const { pkp } = authInfo;

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          User Information
        </h3>
        <div className="mt-5 border-t border-gray-200">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">
                Wallet Address
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {pkp.ethAddress}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">
                Public Key
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono">
                {pkp.publicKey.slice(0, 20)}...
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

export default UserInfo;
```

### Step 7: Implement Logout Functionality

Create a logout button component:

```typescript
// src/components/LogoutButton.tsx
import React from 'react';
import { useJwtContext } from '@lit-protocol/vincent-app-sdk/react';

function LogoutButton() {
  const { logOut } = useJwtContext();

  return (
    <button
      onClick={logOut}
      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
    >
      Logout
    </button>
  );
}

export default LogoutButton;
```

### Step 8: Create API Integration Hook

Build a custom hook for making authenticated API calls:

```typescript
// src/hooks/useApi.ts
import { useCallback } from 'react';
import { useJwtContext } from '@lit-protocol/vincent-app-sdk/react';
import { config } from '../config/env';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export function useApi() {
  const { authInfo } = useJwtContext();

  const makeRequest = useCallback(
    async <T>(
      endpoint: string,
      method: HttpMethod = 'GET',
      body?: any
    ): Promise<T> => {
      if (!authInfo?.jwt) {
        throw new Error('User not authenticated');
      }

      const headers: HeadersInit = {
        'Authorization': `Bearer ${authInfo.jwt}`,
        'Content-Type': 'application/json',
      };

      const requestOptions: RequestInit = {
        method,
        headers,
      };

      if (body && method !== 'GET') {
        requestOptions.body = JSON.stringify(body);
      }

      const response = await fetch(
        `${config.backendApiUrl}${endpoint}`,
        requestOptions
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return response.json();
    },
    [authInfo]
  );

  // Convenience methods
  const get = useCallback(<T>(endpoint: string) => 
    makeRequest<T>(endpoint, 'GET'), [makeRequest]);
  
  const post = useCallback(<T>(endpoint: string, body: any) => 
    makeRequest<T>(endpoint, 'POST', body), [makeRequest]);
  
  const put = useCallback(<T>(endpoint: string, body: any) => 
    makeRequest<T>(endpoint, 'PUT', body), [makeRequest]);
  
  const del = useCallback(<T>(endpoint: string) => 
    makeRequest<T>(endpoint, 'DELETE'), [makeRequest]);

  return {
    makeRequest,
    get,
    post,
    put,
    delete: del,
    isAuthenticated: !!authInfo?.jwt,
  };
}
```

### Step 9: Use the API Hook in Components

Example of using the API hook in a component:

```typescript
// src/components/DataFetcher.tsx
import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';

interface UserData {
  id: string;
  name: string;
  email: string;
}

function DataFetcher() {
  const { get, isAuthenticated } = useApi();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await get<UserData>('/user/profile');
        setUserData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [get, isAuthenticated]);

  if (!isAuthenticated) {
    return <div>Please log in to view this content.</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  return (
    <div>
      {userData ? (
        <div>
          <h2>Welcome, {userData.name}!</h2>
          <p>Email: {userData.email}</p>
        </div>
      ) : (
        <div>No user data available.</div>
      )}
    </div>
  );
}

export default DataFetcher;
```

## Advanced Configuration

### Custom Consent Page

You can customize the Vincent consent page URL:

```typescript
const handleConnect = () => {
  vincentWebAuthClient.redirectToConnectPage({
    redirectUri: config.redirectUri,
    consentPageUrl: 'https://your-custom-domain.com/consent',
  });
};
```

### JWT Validation

For additional security, you can validate the JWT on the frontend:

```typescript
// src/utils/jwtValidation.ts
import { isAppUser, getPKPInfo, getAppInfo } from '@lit-protocol/vincent-app-sdk/jwt';

export function validateJWT(decodedJWT: any, expectedAppId: number): boolean {
  // Check if it's a valid app user JWT
  if (!isAppUser(decodedJWT)) {
    return false;
  }

  // Validate app ID matches
  const appInfo = getAppInfo(decodedJWT);
  if (appInfo.appId !== expectedAppId) {
    return false;
  }

  // Additional validation logic can be added here
  return true;
}
```

### Error Handling

Implement comprehensive error handling:

```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Vincent integration error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              There was an error with the Vincent integration.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

## Best Practices

### 1. Environment Management
- Use different Vincent App IDs for development, staging, and production
- Store sensitive configuration in environment variables
- Validate environment variables at startup

### 2. Error Handling
- Implement comprehensive error boundaries
- Provide clear error messages to users
- Log errors for debugging purposes

### 3. Loading States
- Show loading indicators during authentication
- Handle network timeouts gracefully
- Provide retry mechanisms for failed requests

### 4. Security
- Always validate JWTs on your backend
- Use HTTPS in production
- Implement proper CORS policies
- Never store sensitive data in localStorage

### 5. User Experience
- Provide clear instructions for the authentication flow
- Handle edge cases (e.g., user denies permission)
- Implement proper logout functionality
- Show connection status clearly

## Troubleshooting

### Common Issues

1. **JWT Not Found**
   - Ensure the redirect URI matches exactly
   - Check that the Vincent App ID is correct
   - Verify the user completed the consent flow

2. **CORS Errors**
   - Configure your backend to allow requests from your frontend domain
   - Ensure proper preflight handling for OPTIONS requests

3. **Authentication Loops**
   - Check for infinite redirects in your routing logic
   - Ensure proper cleanup of authentication state

4. **Backend Validation Failures**
   - Verify your backend is properly validating Vincent JWTs
   - Check that the expected audience matches

### Debug Mode

Enable debug logging in development:

```typescript
// Add to your development environment
if (process.env.NODE_ENV === 'development') {
  localStorage.setItem('debug', 'vincent:*');
}
```

## Security Considerations

### Frontend Security
- Never store private keys or sensitive data in the frontend
- Validate all user inputs before sending to backend
- Use Content Security Policy (CSP) headers
- Implement proper session timeout handling

### JWT Handling
- JWTs should be validated on every backend request
- Implement proper token expiration handling
- Use secure HTTP-only cookies when possible
- Never log JWTs in production

### Network Security
- Always use HTTPS in production
- Implement proper CORS policies
- Use secure headers (HSTS, X-Frame-Options, etc.)
- Validate all API responses

## Examples

### Complete Minimal Integration

Here's a complete minimal example:

```typescript
// src/App.tsx
import React from 'react';
import { JwtProvider, useJwtContext, useVincentWebAuthClient } from '@lit-protocol/vincent-app-sdk/react';

const APP_ID = 123; // Your Vincent App ID
const REDIRECT_URI = window.location.origin;

function LoginButton() {
  const client = useVincentWebAuthClient(APP_ID);
  
  return (
    <button onClick={() => client.redirectToConnectPage({ redirectUri: REDIRECT_URI })}>
      Connect with Vincent
    </button>
  );
}

function AuthenticatedContent() {
  const { authInfo, logOut } = useJwtContext();
  
  return (
    <div>
      <h1>Welcome!</h1>
      <p>Wallet: {authInfo.pkp.ethAddress}</p>
      <button onClick={logOut}>Logout</button>
    </div>
  );
}

function AppContent() {
  const { authInfo } = useJwtContext();
  return authInfo ? <AuthenticatedContent /> : <LoginButton />;
}

function App() {
  return (
    <JwtProvider appId={APP_ID}>
      <AppContent />
    </JwtProvider>
  );
}

export default App;
```

This integration guide provides everything your developers need to successfully integrate Vincent authentication into any React frontend application. The modular approach ensures they can adapt the code to their specific project structure and requirements.