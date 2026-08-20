---
title: "API Reference"
description: "Complete reference for the Quill REST API."
order: 3
section: "reference"
---

## Base URL

```
https://api.quill.dev/v2
```

## Resources

### List Resources

```
GET /resources
```

Returns a paginated list of all resources.

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |
| `sort` | string | Sort field (`created_at`, `updated_at`, `name`) |
| `order` | string | `asc` or `desc` |

**Response:**

```json
{
  "data": [
    {
      "id": "res_abc123",
      "name": "My Resource",
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 156
  }
}
```

### Create Resource

```
POST /resources
```

**Body:**

```json
{
  "name": "New Resource",
  "type": "document",
  "metadata": {
    "category": "reports"
  }
}
```

### Get Resource

```
GET /resources/:id
```

### Update Resource

```
PATCH /resources/:id
```

### Delete Resource

```
DELETE /resources/:id
```

Returns `204 No Content` on success.

## Errors

| Code | Description |
|------|-------------|
| `400` | Bad Request — invalid parameters |
| `401` | Unauthorized — invalid or missing API key |
| `403` | Forbidden — insufficient permissions |
| `404` | Not Found — resource doesn't exist |
| `429` | Too Many Requests — rate limit exceeded |
| `500` | Internal Server Error |
