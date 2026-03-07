# SDKs

Official client libraries for the [Organization Name] API.

---

## Python

### Installation

```bash
pip install [org]-markets
```

### Usage

```python
from org_markets import Client

client = Client(api_key="YOUR_API_KEY")

# Get [Index A] scores
countries = client.index_a.list_countries()
ghana = client.index_a.get_country("GH")

# Get alerts
alerts = client.alerts.list(jurisdiction="GH", limit=10)

# Subscribe to webhooks
client.webhooks.create(
    url="https://your-server.com/webhook",
    events=["alert.created", "[index-a].updated"]
)
```

---

## JavaScript / TypeScript

### Installation

```bash
npm install @[org]/markets
```

### Usage

```typescript
import { [Org]Client } from '@[org]/markets';

const client = new [Org]Client({ apiKey: 'YOUR_API_KEY' });

// Get [Index A] scores
const countries = await client.index_a.listCountries();
const ghana = await client.index_a.getCountry('GH');

// Get alerts
const alerts = await client.alerts.list({
  jurisdiction: 'GH',
  limit: 10
});
```

---

## Coming Soon

- TypeScript
- Go
- Java
- PHP

---

## Contributing

SDKs are open source. Contributions welcome:

- Python: github.com/[org]-markets/python-sdk
- JavaScript: github.com/[org]-markets/js-sdk
