# Admin Feature

Sidebar-navigated admin dashboard for platform management. Only accessible to users with `admin` role.

## Structure

```
admin/
├── components/
│   ├── AdminPage.tsx                # Entry: auth guard + useAdminData + sidebar + view router
│   ├── AdminSidebar.tsx             # Sidebar nav with icons + badge counts (mobile: horizontal tabs)
│   ├── AdminOverview.tsx            # Dashboard overview with stat cards
│   ├── EventModerationView.tsx      # Events table with search, filters, sort, batch ops
│   ├── ArtworkModerationView.tsx    # Artworks table with search, filters, sort, batch ops
│   ├── CreatorApplicationsView.tsx  # Pending role applications table
│   ├── ManualPublishView.tsx        # Manual event creation form + CSV bulk import
│   ├── UserManagementView.tsx       # All users table with role management
│   ├── EventEditDrawer.tsx          # Full event edit form in Drawer
│   ├── ArtworkEditDrawer.tsx        # Full artwork edit form in Drawer
│   └── index.ts
├── hooks/
│   ├── useAdminData.ts              # Centralized data loading + mutations for all views
│   └── useTableFilters.ts           # Reusable search/sort/filter/selection state
├── types/
│   └── admin.types.ts               # AdminView, ModerationTab, AdminCounts, etc.
└── utils/
    └── admin-utils.ts               # groupEventsByGallery, groupArtworksByArtist, filterByModerationStatus
```

## Navigation

Uses `?view=` query param on `/admin`: `overview` | `events` | `artworks` | `creators` | `publish` | `users`.

## Access control

- Route-level: middleware redirects non-admin users from `/admin` to `/profile`
- Component-level: `canAccessAdmin(role)` from `@/features/auth/utils/roles`

## Data

`useAdminData()` centralizes all data fetching and mutations:
- Events via `useEventsCatalog()` with `skipAutoRefresh: true`
- Artworks via `api.getArtworks()`
- Profiles via `api.getProfiles()`
- Mutations: `moderateEvent`, `batchModerateEvents`, `moderateArtwork`, `batchModerateArtworks`, `handleRoleApplication`, `updateUserRole`
