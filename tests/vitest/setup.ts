// Extend Jest "expect" functionality with Testing Library assertions.
// This setup will run before each test. You can add global configuration here, like
// setting up mocks for shared modules, configuring testing utilities, etc.
import '@testing-library/jest-dom';

// Provide a jsdom-friendly mock for window.matchMedia used by `useIsMobile`.
// jsdom does not implement matchMedia by default which causes tests to throw.
// The mock supports addEventListener/removeEventListener and legacy addListener/removeListener.
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => {
        const listeners = new Set<(e: MediaQueryListEvent) => void>();
        const mql = {
            matches: false,
            media: query,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
            onchange: null as Function | null,
            addEventListener: (type: string, listener: (e: MediaQueryListEvent) => void) => {
                if (type === 'change') {
                    listeners.add(listener);
                }
            },
            removeEventListener: (type: string, listener: (e: MediaQueryListEvent) => void) => {
                if (type === 'change') {
                    listeners.delete(listener);
                }
            },
            addListener: (listener: (e: MediaQueryListEvent) => void) => {
                listeners.add(listener);
            },
            removeListener: (listener: (e: MediaQueryListEvent) => void) => {
                listeners.delete(listener);
            },
            dispatchEvent: (event: MediaQueryListEvent) => {
                listeners.forEach((l) => l(event));
                return true;
            },
        } as Partial<MediaQueryList> & { dispatchEvent: (e: MediaQueryListEvent) => boolean };

        return mql as MediaQueryList;
    },
});
