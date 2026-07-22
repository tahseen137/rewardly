declare module 'expo-apple-authentication' {
  export const AppleAuthenticationScope: {
    FULL_NAME: number;
    EMAIL: number;
  };

  export const AppleAuthenticationCredentialState: {
    REVOKED: number;
    AUTHORIZED: number;
    NOT_FOUND: number;
    TRANSFERRED: number;
  };

  export function signInAsync(options?: any): Promise<{
    user: string;
    identityToken: string | null;
    authorizationCode: string | null;
    fullName: { givenName: string | null; familyName: string | null } | null;
    email: string | null;
  }>;

  export function getCredentialStateAsync(user: string): Promise<number>;
  export function isAvailableAsync(): Promise<boolean>;
}
