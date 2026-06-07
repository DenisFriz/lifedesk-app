# Cloudinary Integration Guide

## Setup

### 1. Add Cloudinary Credentials to `.env`

```bash
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
```

Get these from your [Cloudinary Dashboard](https://cloudinary.com/console).

### 2. Backend Endpoints

#### `POST /cloudinary/signature` (requires auth)

Returns a short-lived signed upload credential.

**Request:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/cloudinary/signature
```

**Response:**
```json
{
  "timestamp": 1234567890,
  "signature": "abc123def456...",
  "api_key": "your_api_key",
  "cloud_name": "your_cloud_name",
  "folder": "uploads"
}
```

#### `POST /cloudinary/images` (requires auth)

Persist a Cloudinary image URL to the database after upload.

**Request:**
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://res.cloudinary.com/.../image.jpg",
    "publicId": "uploads/abc123"
  }' \
  http://localhost:3001/cloudinary/images
```

**Response:**
```json
{
  "_id": "...",
  "imageUrl": "https://res.cloudinary.com/.../image.jpg",
  "publicId": "uploads/abc123",
  "created_by": "...",
  "createdAt": "2025-02-01T12:00:00Z",
  "updatedAt": "2025-02-01T12:00:00Z"
}
```

---

## Frontend Usage

### Using the Hook

```tsx
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload'

function MyComponent() {
  const { upload, isLoading, error } = useCloudinaryUpload()

  async function handleUpload(file: File) {
    try {
      const result = await upload(file)
      console.log('Uploaded:', result.secure_url)
    } catch (err) {
      console.error('Upload failed:', err.message)
    }
  }

  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        disabled={isLoading}
      />
      {error && <p>Error: {error}</p>}
    </div>
  )
}
```

### Using the Component

```tsx
import CloudinaryUpload from '@/components/CloudinaryUpload'

export default function App() {
  return <CloudinaryUpload />
}
```

---

## Flow Diagram

```
Frontend                    Backend                    Cloudinary
   |                          |                            |
   |---(1) select file-------->|                            |
   |                          |                            |
   |<-(2) POST /cloudinary/signature-response---|          |
   |       {timestamp, signature, api_key, cloud_name}    |
   |                          |                            |
   |---(3) POST to Cloudinary API with signed data------->|
   |                          |                            |
   |<----------(4) {secure_url, public_id}------------------|
   |                          |                            |
   |---(5) POST /cloudinary/images with URL--------->|     |
   |                          |                            |
   |<-(6) {_id, imageUrl, publicId, created_by, ...}|     |
   |                          |                            |
```

---

## Notes

- **No Backend File I/O**: The backend never touches the file itself — only signs the upload request.
- **Direct CDN Upload**: Files upload directly to Cloudinary's API, bypassing your backend entirely.
- **Secure Signing**: The `CLOUDINARY_API_SECRET` is never exposed to the frontend; only the backend can generate valid signatures.
- **Database Persistence**: After upload, the frontend calls `/cloudinary/images` to store the Cloudinary URL in MongoDB.
- **Existing Flow Unchanged**: The old `POST /upload` disk-based endpoint is still available for backward compatibility.

---

## Troubleshooting

### "Cloudinary env vars not configured"
Make sure all three env vars are set in your `.env` file and the backend was restarted.

### "Cloudinary upload failed (401)"
The signature is invalid. Check that `CLOUDINARY_API_SECRET` is correct and matches your Cloudinary dashboard.

### "imageUrl is required"
The frontend is calling `POST /cloudinary/images` without an `imageUrl` field. Ensure the Cloudinary upload succeeded and returned `secure_url`.

### Network error when uploading to Cloudinary
- Check that `CLOUDINARY_CLOUD_NAME` is correct
- Verify CORS isn't blocking the `fetch` request to `api.cloudinary.com` (modern browsers allow it by default)
- Check DevTools Network tab for the full error response

---

## Testing with cURL

### 1. Get a token (login first or create a test user)
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}'
```

Copy the `accessToken` from the response.

### 2. Get a signature
```bash
curl -H "Authorization: Bearer <accessToken>" \
  http://localhost:3001/cloudinary/signature
```

### 3. Upload to Cloudinary (using the signed data)
```bash
curl -F "file=@/path/to/image.jpg" \
  -F "timestamp=<timestamp>" \
  -F "signature=<signature>" \
  -F "api_key=<api_key>" \
  -F "folder=uploads" \
  https://api.cloudinary.com/v1_1/<cloud_name>/image/upload
```

### 4. Save to database
```bash
curl -X POST http://localhost:3001/cloudinary/images \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "<secure_url from step 3>",
    "publicId": "<public_id from step 3>"
  }'
```
