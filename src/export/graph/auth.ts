/**
 * Microsoft Graph authentication via MSAL (US4 cloud export). Uses the
 * authorization-code/PKCE public-client flow with least-privilege, incremental
 * scopes requested only at the moment of a consented cloud export (FR-011/012).
 *
 * No token is acquired or cached unless the user has explicitly consented; the
 * account can be fully signed out, clearing the token cache (data rights).
 */
import {
  PublicClientApplication,
  type AccountInfo as MsalAccount,
  type Configuration,
} from '@azure/msal-browser';
import type { AccountInfo } from '../../lib/types';
import { logger } from '../../lib/logging';

const CLIENT_ID = import.meta.env?.VITE_MSAL_CLIENT_ID ?? '';
const AUTHORITY = 'https://login.microsoftonline.com/common';

const config: Configuration = {
  auth: { clientId: CLIENT_ID, authority: AUTHORITY, redirectUri: window.location.origin },
  cache: { cacheLocation: 'sessionStorage', storeAuthStateInCookie: false },
};

let pca: PublicClientApplication | null = null;

async function getClient(): Promise<PublicClientApplication> {
  if (!pca) {
    pca = new PublicClientApplication(config);
    await pca.initialize();
  }
  return pca;
}

function toAccountInfo(acc: MsalAccount): AccountInfo {
  return { username: acc.username, homeAccountId: acc.homeAccountId };
}

/** Interactively sign in and acquire a token for the requested scopes. */
export async function signIn(scopes: string[]): Promise<{ token: string; account: AccountInfo }> {
  const client = await getClient();
  const result = await client.acquireTokenPopup({ scopes });
  logger.info('graph.signIn', { scopeCount: scopes.length });
  return { token: result.accessToken, account: toAccountInfo(result.account) };
}

/** Acquire a token silently if an account is already present, else interactively. */
export async function getToken(scopes: string[]): Promise<string> {
  const client = await getClient();
  const account = client.getAllAccounts()[0];
  if (account) {
    try {
      const silent = await client.acquireTokenSilent({ scopes, account });
      return silent.accessToken;
    } catch {
      // Fall through to interactive.
    }
  }
  const result = await client.acquireTokenPopup({ scopes });
  return result.accessToken;
}

/** Sign out and clear the MSAL token cache (FR-012 data rights). */
export async function signOut(): Promise<void> {
  const client = await getClient();
  const account = client.getAllAccounts()[0];
  if (account) await client.clearCache({ account });
  logger.info('graph.signOut');
}
