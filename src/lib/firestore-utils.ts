
/**
 * @fileOverview Utility functions for interacting with Firestore.
 */

/**
 * Sanitizes an object to be sent to Firestore by recursively removing any keys
 * with `undefined` as their value. Firestore does not allow `undefined`.
 * It also handles nested objects.
 *
 * @param obj The object to sanitize.
 * @returns A new object with all `undefined` values removed.
 */
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Partial<T> {
  const sanitized: Partial<T> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value !== undefined) {
        if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value?.constructor?.name === 'Timestamp')) {
           // Recursively sanitize nested objects, but not Timestamps or arrays
          sanitized[key as keyof T] = sanitizeForFirestore(value) as any;
        } else {
          sanitized[key as keyof T] = value;
        }
      }
    }
  }
  return sanitized;
}
