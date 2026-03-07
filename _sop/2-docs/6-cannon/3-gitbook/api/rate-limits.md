# Rate Limits

API rate limits protect service quality for all users.

---

## Limits by Tier

| Tier         | Requests/Hour | Requests/Day | Burst  |
| ------------ | ------------- | ------------ | ------ |
| Standard     | 1,000         | 10,000       | 50     |
| Professional | 5,000         | 50,000       | 200    |
| Enterprise   | Custom        | Custom       | Custom |

---

## Headers

Every response includes rate limit headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1706400000
```

---

## Exceeded Limits

When limits are exceeded, you'll receive:

```
HTTP/1.1 429 Too Many Requests

{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "retry_after": 60
  }
}
```

---

## Best Practices

- Cache responses where appropriate
- Use webhooks instead of polling
- Implement exponential backoff
- Monitor your usage dashboard
- Contact sales for higher limits
