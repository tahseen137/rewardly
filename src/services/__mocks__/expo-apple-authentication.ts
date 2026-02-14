export const AppleAuthenticationScope = {
  FULL_NAME: 0,
  EMAIL: 1,
};

export const AppleAuthenticationCredentialState = {
  REVOKED: 0,
  AUTHORIZED: 1,
  NOT_FOUND: 2,
  TRANSFERRED: 3,
};

export async function signInAsync() {
  return {
    user: 'mock-apple-user',
    identityToken: 'mock-identity-token',
    authorizationCode: 'mock-auth-code',
    fullName: { givenName: 'Test', familyName: 'User' },
    email: 'test@apple.com',
  };
}

export async function getCredentialStateAsync() {
  return AppleAuthenticationCredentialState.AUTHORIZED;
}

export const isAvailableAsync = async () => false;

export default {
  AppleAuthenticationScope,
  AppleAuthenticationCredentialState,
  signInAsync,
  getCredentialStateAsync,
  isAvailableAsync,
};
