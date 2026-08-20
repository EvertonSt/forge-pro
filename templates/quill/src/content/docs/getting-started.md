---
title: "Getting Started"
description: "Set up Quill in under 5 minutes."
order: 1
section: "basics"
---

## Installation

Install Quill using your preferred package manager:

```bash
npm install quill-sdk
# or
yarn add quill-sdk
# or
pnpm add quill-sdk
```

## Quick Setup

Import and initialize Quill in your application:

```javascript
import { Quill } from 'quill-sdk';

const app = new Quill({
  apiKey: 'your-api-key',
  environment: 'production',
});

// Verify the connection
const status = await app.ping();
console.log('Connected:', status.ok);
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | string | required | Your API key from the dashboard |
| `environment` | string | `'production'` | `'development'` or `'production'` |
| `timeout` | number | `5000` | Request timeout in milliseconds |
| `retries` | number | `3` | Number of retry attempts |

## Next Steps

- Read the [Authentication](/docs/authentication) guide
- Explore the [API Reference](/docs/api-reference)
- Check out the [Examples](/docs/examples)
