---
title: "Authentication"
description: "Secure your API requests with authentication tokens."
order: 2
section: "basics"
---

## API Keys

Every request to the Quill API must include a valid API key. You can generate keys from your dashboard.

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.quill.dev/v2/resources
```

## Token Authentication

For user-scoped operations, use JWT tokens:

```javascript
const token = await app.auth.createToken({
  userId: 'user_123',
  permissions: ['read', 'write'],
  expiresIn: '24h',
});
```

## Rate Limiting

| Plan | Requests/min | Burst |
|------|-------------|-------|
| Free | 60 | 10 |
| Pro | 600 | 100 |
| Enterprise | 6000 | 1000 |

> **Note:** Exceeding rate limits returns a `429 Too Many Requests` response. Implement exponential backoff for retries.

## Security Best Practices

1. **Never expose API keys in client-side code** — use environment variables
2. **Rotate keys regularly** — set up automatic rotation in your dashboard
3. **Use least-privilege tokens** — grant only the permissions needed
4. **Monitor usage** — check the dashboard for anomalous patterns
