"use client";

// Mock auth for the backend-less prototype. Starts logged OUT; social sign-in
// (Apple / Google) just flips state — there is no real OAuth. `requireLogin`
// is the gate: run the action if signed in, otherwise open the sign-in modal
// and queue the action to run after a successful sign-in.

import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { MOCK_USER, type PlanId } from "@/lib/user";
import { authStore, hydratedStore } from "@/lib/authStore";
import { SignInModal } from "@/components/auth/SignInModal";

interface AuthValue {
  loggedIn: boolean;
  /** True once persisted state has been read from localStorage (post-mount). */
  hydrated: boolean;
  /** Account tier: guest (logged out) · free (logged in) · subscriber (Muse Pro). */
  status: AccountStatus;
  subscribed: boolean;
  /** The plan the user subscribed to, or null when not a subscriber. */
  subscribedPlan: PlanId | null;
  /** Editable profile shown across the shell. `avatar` null → show the initial. */
  profile: Profile;
  /** Run `onSuccess` if signed in, else open the sign-in modal and queue it.
   *  `onCancel` runs if the user dismisses the modal without signing in. */
  requireLogin: (onSuccess?: () => void, onCancel?: () => void) => void;
  /** Open the sign-in modal with no queued action (e.g. header "Sign In"). */
  openSignIn: () => void;
  signOut: () => void;
  /** Flip the account to subscriber (Muse Pro). Credits are granted by the caller. */
  subscribe: (plan: PlanId) => void;
  updateProfile: (patch: Partial<Pick<Profile, "name" | "avatar">>) => void;
}

export type AccountStatus = "guest" | "free" | "subscriber";
export interface Profile {
  name: string;
  email: string;
  avatar: string | null;
}
const DEFAULT_PROFILE: Profile = { name: MOCK_USER.name, email: MOCK_USER.email, avatar: null };

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const loggedIn = useSyncExternalStore(authStore.subscribe, authStore.getSnapshot, authStore.getServerSnapshot);
  const hydrated = useSyncExternalStore(hydratedStore.subscribe, hydratedStore.getSnapshot, hydratedStore.getServerSnapshot);
  const [modalOpen, setModalOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subscribedPlan, setSubscribedPlan] = useState<PlanId | null>(null);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const pending = useRef<(() => void) | null>(null);
  const cancel = useRef<(() => void) | null>(null);

  const openSignIn = useCallback(() => {
    pending.current = null;
    cancel.current = null;
    setModalOpen(true);
  }, []);

  const requireLogin = useCallback(
    (onSuccess?: () => void, onCancel?: () => void) => {
      if (loggedIn) {
        onSuccess?.();
        return;
      }
      pending.current = onSuccess ?? null;
      cancel.current = onCancel ?? null;
      setModalOpen(true);
    },
    [loggedIn],
  );

  const handleSignedIn = useCallback(() => {
    authStore.set(true);
    setModalOpen(false);
    const fn = pending.current;
    pending.current = null;
    cancel.current = null;
    fn?.();
  }, []);

  const handleClose = useCallback(() => {
    setModalOpen(false);
    const fn = cancel.current;
    pending.current = null;
    cancel.current = null;
    fn?.();
  }, []);

  const signOut = useCallback(() => {
    authStore.set(false);
    setSubscribed(false);
    setSubscribedPlan(null);
    setProfile(DEFAULT_PROFILE);
  }, []);

  const subscribe = useCallback((plan: PlanId) => {
    setSubscribed(true);
    setSubscribedPlan(plan);
  }, []);

  const updateProfile = useCallback((patch: Partial<Pick<Profile, "name" | "avatar">>) => {
    setProfile((p) => ({ ...p, ...patch }));
  }, []);

  const status: AccountStatus = !loggedIn ? "guest" : subscribed ? "subscriber" : "free";

  const value = useMemo<AuthValue>(
    () => ({ loggedIn, hydrated, status, subscribed, subscribedPlan, profile, requireLogin, openSignIn, signOut, subscribe, updateProfile }),
    [loggedIn, hydrated, status, subscribed, subscribedPlan, profile, requireLogin, openSignIn, signOut, subscribe, updateProfile],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <SignInModal open={modalOpen} onClose={handleClose} onSignedIn={handleSignedIn} />
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
