# Auth Feature

Handles user authentication, authorization, and role management.

## Structure

```
auth/
├── components/
│   ├── AuthDialog.tsx           # Sign-in / sign-up / password-reset modal
│   └── index.ts
├── hooks/
│   ├── useAuthController.ts     # Core auth logic (the main hook)
│   └── index.ts
├── types/
│   ├── auth.types.ts            # User, UserRole, SignUpRole
│   └── index.ts
└── utils/
    └── roles.ts                 # Role permission checks and display labels
```

## Key types

- **`User`** — `{ id, name, email, role: UserRole, avatar }`
- **`UserRole`** — `'art_lover' | 'artist_pending' | 'artist' | 'gallery_manager_pending' | 'gallery_manager' | 'gallery' | 'admin'`
- **`SignUpRole`** — `'art_lover' | 'artist_pending' | 'gallery_manager_pending'`

## Auth flow

`useAuthController` manages the full auth lifecycle:

1. **Session init**: checks current Supabase session
2. **Auth state listener**: subscribes to `supabase.auth.onAuthStateChange`
3. **Profile sync**: on auth, fetches/creates profile via `api.getProfile()` + `api.syncUser()`
4. **URL-driven auth**: reads `?auth=signin|signup|reset` and `?redirectTo=` from URL to auto-open dialog

## Auth methods

- `loginWithGoogle()` — Supabase OAuth with Google
- `loginWithPassword(email, password)` — email/password sign-in
- `signUpWithPassword(name, email, password, role)` — creates account + syncs profile
- `resetPassword(email)` — sends password reset email
- `logout()` — signs out from Supabase + clears local state

## Role utilities (`roles.ts`)

- `canAccessAdmin(role)` — only `admin`
- `canSubmitListings(role)` — all creator roles + admin
- `canPublishWithoutApproval(role)` — verified creators + admin
- `hasCreatorWorkspaceAccess(role)` — same as canSubmitListings
- `isCreatorApplicationPending(role)` — `artist_pending` or `gallery_manager_pending`
- `getRoleLabel(role)` — human-readable role name
- `getRoleApplicationCopy(role)` — status message for pending/approved roles

## Integration

The `AuthProvider` (in `src/app/providers/AuthProvider.tsx`) wraps the app and exposes `useAuth()` which returns the full `useAuthController` return value. It also renders the `AuthDialog` when `isAuthDialogOpen` is true.

## Important patterns

- Supabase may not be configured (no env vars) — all auth methods check for `supabase` before calling and show a warning via `notify()` if missing
- Profile avatar falls back to DiceBear initials API
