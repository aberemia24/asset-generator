
import { useState } from 'react';

/**
 * A custom hook to synchronize state with the browser's localStorage.
 * It provides a state value and a setter function, similar to `useState`,
 * but persists the value across page reloads.
 * @template T The type of the value to be stored.
 * @param {string} key The key under which the value is stored in localStorage.
 * @param {T} initialValue The initial value to use if no value is found in localStorage.
 * @returns {[T, (value: T | ((val: T) => T)) => void]} A tuple containing the current state value and a function to update it.
 */
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
}

export default useLocalStorage;