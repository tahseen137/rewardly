/**
 * Mock implementation of AsyncStorage for testing
 */

const storage: Map<string, string> = new Map();

const AsyncStorage = {
  getItem: jest.fn(async (key: string): Promise<string | null> => {
    return storage.get(key) ?? null;
  }),

  setItem: jest.fn(async (key: string, value: string): Promise<void> => {
    storage.set(key, value);
  }),

  removeItem: jest.fn(async (key: string): Promise<void> => {
    storage.delete(key);
  }),

  clear: jest.fn(async (): Promise<void> => {
    storage.clear();
  }),

  getAllKeys: jest.fn(async (): Promise<string[]> => {
    return Array.from(storage.keys());
  }),

  // Helper for tests to clear the mock storage
  __clearMockStorage: (): void => {
    storage.clear();
  },
};

export default AsyncStorage;
