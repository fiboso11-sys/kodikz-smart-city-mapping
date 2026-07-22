# Authentication

Providers: Local (pilot), OIDC adapter (municipality), Mock (local only).

- bcrypt password hashing
- JWT access tokens via jose
- HttpOnly cookie `kodikz_access`
- Login throttling and lockout
- Session revocation
- Seeded pilot accounts — change passwords immediately

Protected APIs use server-derived AuthContext only.
