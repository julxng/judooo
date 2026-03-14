# Profile Feature

User profile page showing account info, role status, and saved content.

## Structure

```
profile/
└── components/
    └── ProfilePage.tsx   # Profile display + role application UI
```

## Capabilities

- Displays user name, email, avatar, and current role label
- Shows role application status for pending creator roles
- Provides "Apply as Artist" / "Apply as Gallery Manager" buttons via `useAuth().requestCreatorRole()`
- Links to saved events and route planner
