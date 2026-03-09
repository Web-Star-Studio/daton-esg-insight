

## Plan: Promote user to platform_admin

### What
Insert `fgsantunes@gmail.com` (user ID `48e5f925-9470-43a5-91b7-01490747cec3`) into the `platform_admins` table and update their role in `user_roles` to `platform_admin`.

### Steps
1. **Insert into `platform_admins`** table with the user's ID
2. **Update `user_roles`** to set role = `platform_admin` for this user (or insert if not present with that role)

### Access Point
No sidebar change needed — the "Platform Admin" button already appears in the **header profile dropdown** (avatar menu, top-right) for `platform_admin` users, as designed.

