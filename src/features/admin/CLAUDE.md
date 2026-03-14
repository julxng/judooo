# Admin Feature

Admin dashboard for managing the platform. Only accessible to users with `admin` role.

## Structure

```
admin/
├── components/
│   ├── AdminPage.tsx          # Page wrapper (renders AdminDashboard)
│   ├── AdminDashboard.tsx     # Main dashboard: event/artwork/user management, bulk import
│   └── index.ts
```

## Capabilities

The admin dashboard provides:
- **Event management** — view, edit, approve/reject submitted events
- **Artwork management** — view, edit, approve/reject submitted artworks
- **User management** — view profiles, change roles (approve artist/gallery applications)
- **Bulk import** — trigger data import operations

## Access control

- Route-level: middleware redirects non-admin users from `/admin` to `/profile`
- Component-level: `canAccessAdmin(role)` from `@/features/auth/utils/roles` returns true only for `admin` role
- `useAuth().canAccessAdmin` is the primary check used in components

## Data

Admin uses `api.getEvents()`, `api.getArtworks()`, `api.getProfiles()` for listing, and `api.updateEvent()`, `api.updateArtwork()`, `api.syncUser()` for modifications. All operations go through the unified API facade in `src/services/api/`.
