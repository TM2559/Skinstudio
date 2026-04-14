import { signInAnonymously } from 'firebase/auth';
import { auth } from '../firebaseConfig';

/** Callable musí nést ID token, jinak server nenastaví claim `admin`. */
export async function ensureAnonymousAuthForCallable() {
  await auth.authStateReady?.();
  if (!auth.currentUser) await signInAnonymously(auth);
}

/**
 * Po serializaci přes Firebase sjednotíme id a rawId (SimpleWebAuthn vyžaduje shodu).
 * Platí pro authentication assertion i registration credential.
 */
export function packWebAuthnCredentialForCallable(credential) {
  const plain = JSON.parse(JSON.stringify(credential));
  const rawId = typeof plain.rawId === 'string' ? plain.rawId : plain.id;
  if (!rawId) return plain;
  return { ...plain, id: rawId, rawId };
}
