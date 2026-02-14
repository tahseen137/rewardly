/**
 * CountryChangeEmitter - Simple event emitter for country changes
 * Allows components to subscribe and react when the user changes their country preference
 */

type CountryChangeListener = () => void;

class CountryChangeEmitterClass {
  private listeners: Set<CountryChangeListener> = new Set();

  /**
   * Subscribe to country change events
   * @returns Unsubscribe function
   */
  subscribe(listener: CountryChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Emit a country change event to all listeners
   */
  emit(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        console.error('Error in country change listener:', error);
      }
    });
  }
}

export const CountryChangeEmitter = new CountryChangeEmitterClass();
