# KYC Architecture

## Overview

The KYC (Know Your Customer) module lets users submit identity documents for compliance review. A compliance operator reviews submissions and approves, rejects, or requests updates via the admin service layer. Approval upgrades the user's `kycTier` and invalidates stale sessions.

---

## Database Models

### `KycProfile` (1 per user)

| Field             | Notes                                         |
|-------------------|-----------------------------------------------|
| `userId`          | Unique — one profile per user                |
| `status`          | `pending → under_review → approved / rejected / update_requested` |
| `tierRequested`   | KYC tier being applied for (always `2`)      |
| `rejectionReason` | Set on reject / update_requested             |
| `reviewedById`    | Admin user who reviewed                      |
| `reviewedAt`      | Timestamp of last review action              |
| `submittedAt`     | Reset on each re-submission                  |

### `KycDocument` (4 per submission, versioned)

| Field            | Notes                                              |
|------------------|----------------------------------------------------|
| `kycProfileId`   | Parent profile                                     |
| `docType`        | `id_front / id_back / selfie / address_proof`      |
| `filePath`       | Storage-relative path (`kyc/{userId}/{type}/…`)   |
| `status`         | `pending / approved / rejected`                   |
| `rejectionReason`| Per-document rejection note (used in update flow) |
| `version`        | Increments on re-upload — old docs are retained   |

**Version strategy:** Old documents are never deleted. Each re-upload creates a new row with `version + 1`. Queries always select the highest version per `docType`.

---

## Document Types & UI Labels

| `KycDocType`   | UI Label                | Required |
|----------------|-------------------------|----------|
| `id_front`     | Passport                | Yes      |
| `id_back`      | National ID             | No       |
| `selfie`       | Selfie with Document    | Yes      |
| `address_proof`| Proof of Address        | Yes      |

`id_back` is optional for users submitting a passport (single-page).

---

## Status State Machine

```
not_started
     │  (user submits)
     ▼
  pending  ◄──────────────────────── (user re-submits)
     │  (admin picks up)                    ▲
     ▼                                      │
under_review ─── requestUpdate ──► update_requested
     │
     ├── approveKYC  ──► approved
     └── rejectKYC   ──► rejected ──────────┘
```

- **`pending`** — awaiting admin pick-up
- **`under_review`** — admin has opened the submission
- **`approved`** — `user.kycTier` upgraded; `sessionVersion` incremented
- **`rejected`** — user must re-submit all documents
- **`update_requested`** — user may re-upload flagged documents; approved docs cannot be replaced

---

## File Storage Abstraction

### Interface (`lib/storage/index.ts`)

```typescript
interface StorageProvider {
  upload(file: Blob, relativePath: string): Promise<string>;  // returns path stored
  getUrl(relativePath: string): string;                       // URL to serve the file
  delete(relativePath: string): Promise<void>;
}
```

### Implementations

| Class                  | Env               | Notes                                         |
|------------------------|-------------------|-----------------------------------------------|
| `LocalStorageProvider` | Development       | Writes to `storage/uploads/` on disk         |
| `S3StorageProvider`    | Production (stub) | Not yet implemented; swap in via env var      |

### Factory

```typescript
// lib/storage/index.ts
export function getStorage(): StorageProvider {
  // if (process.env.STORAGE_PROVIDER === 's3') return new S3StorageProvider();
  return new LocalStorageProvider();
}
```

Set `STORAGE_PROVIDER=s3` and implement `lib/storage/s3.ts` to switch providers without changing call sites.

### Storage path convention

```
kyc/{userId}/{docType}/{timestamp}-{sanitized_filename}
```

Example: `kyc/uuid-123/selfie/1718000000000-selfie_photo.jpg`

### File constraints

| Constraint    | Value                                         |
|---------------|-----------------------------------------------|
| Max size      | 10 MB                                         |
| Allowed types | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` |

---

## File Serving

`GET /api/kyc/files/[...path]`

- Requires authenticated session (`requireAuth`)
- Regular users: path must be prefixed with `kyc/{their userId}/`
- Admins (`super_admin`, `operator`): can access any file
- Path traversal (`..`) is blocked
- Response includes `Cache-Control: private, no-store`

---

## API Routes

### `POST /api/kyc/submit`

Accepts `multipart/form-data` with fields `id_front`, `id_back`, `selfie`, `address_proof` (each a `File`).

**Flow:**
1. Auth check via `requireAuth()`
2. Validate required fields (`id_front`, `selfie`, `address_proof`)
3. Validate file size (≤10 MB) and MIME type
4. Guard: block if profile is `pending`, `under_review`, or `approved`
5. Upload files via `getStorage().upload()`
6. Prisma transaction:
   - Create or reset `KycProfile` (status → `pending`)
   - For each file: create `KycDocument` with incremented `version`
7. Write audit log (`kyc.submitted` or `kyc.resubmitted`)

**Response:** `{ success: true }` or `{ error: string }`

### `GET /api/kyc/status`

Returns the current user's `KycProfile` + latest `KycDocument` per type.

---

## Admin Service Layer (`lib/kyc/admin.ts`)

All functions run inside `prisma.$transaction` and emit an audit log entry.

### `approveKYC(profileId, reviewerId)`

1. Assert profile is `pending` or `under_review`
2. Set profile `status = approved`, `reviewedById`, `reviewedAt`
3. Update `user.kycTier = profile.tierRequested`
4. Increment `user.sessionVersion` (invalidates stale JWT claims per Phase 3.6 pattern)
5. Bulk-approve all `pending` documents on the profile
6. Audit: `kyc.approved`

### `rejectKYC(profileId, reviewerId, reason)`

1. Assert profile is `pending` or `under_review`
2. Set `status = rejected`, `rejectionReason = reason`
3. Audit: `kyc.rejected`

User must re-submit all documents.

### `requestUpdate(profileId, reviewerId, reason, docIds?)`

1. Assert profile is `pending` or `under_review`
2. Set `status = update_requested`, `rejectionReason = reason`
3. If `docIds` provided: set those documents to `status = rejected` with per-document `rejectionReason`
4. Audit: `kyc.update_requested`

User sees per-document rejection reasons in the upload form.

---

## Session Invalidation on Approval

Per the Phase 3.6 pattern, any server-side change that should immediately affect active sessions must increment `user.sessionVersion`. `approveKYC` does this so that the user's next request re-reads their updated `kycTier` from the database rather than from the stale JWT claim.

---

## Future: S3 Integration

To migrate from local storage to S3:

1. Implement `lib/storage/s3.ts`:
   ```typescript
   import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
   import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
   
   export class S3StorageProvider implements StorageProvider {
     async upload(file: Blob, relativePath: string): Promise<string> { ... }
     getUrl(relativePath: string): string { /* return pre-signed URL */ ... }
     async delete(relativePath: string): Promise<void> { ... }
   }
   ```

2. Set environment variables: `STORAGE_PROVIDER=s3`, `AWS_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

3. Update `getStorage()` factory in `lib/storage/index.ts` to branch on `STORAGE_PROVIDER`.

Existing `filePath` values in the database remain valid — they are storage-relative paths, not tied to the local filesystem.

---

## Security Considerations

- **No public access:** KYC documents are never served as static files. All access goes through the auth-protected `/api/kyc/files/` route.
- **Path traversal prevention:** The file-serving route rejects any path containing `..` or not starting with `kyc/`.
- **User isolation:** Regular users can only access files under `kyc/{their userId}/`. Admins can access all files.
- **MIME validation:** File type is checked against the allowlist on upload; the extension in the stored path is derived from the original filename, not the MIME type.
- **Size limit:** 10 MB hard cap per file on the server side.
- **Audit trail:** Every submission, approval, rejection, and update request is logged to `activity_logs`.
- **No PII in JWT:** `kycTier` in the JWT is a tier number (0–3), not raw document data.
