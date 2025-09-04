
/**
 * @fileOverview Utility functions for interacting with Firestore.
 */

/**
 * Sanitizes an object to be sent to Firestore by recursively removing any keys
 * with `undefined` as their value. Firestore does not allow `undefined`.
 * It also handles nested objects and arrays of objects.
 *
 * @param obj The object to sanitize.
 * @returns A new object with all `undefined` values removed.
 */
export function sanitizeForFirestore<T>(obj: T): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item));
  }

  const sanitized: { [key: string]: any } = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = (obj as any)[key];
      if (value !== undefined) {
        if (value !== null && typeof value === 'object' && !(value?.constructor?.name === 'Timestamp')) {
          sanitized[key] = sanitizeForFirestore(value);
        } else {
          sanitized[key] = value;
        }
      }
    }
  }
  return sanitized;
}
