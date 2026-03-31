# API Contracts v0

These are the initial backend mutation and read contracts for the Geo Run MVP.

## Principles

- Reads should be snapshot-oriented.
- Writes should be explicit command endpoints.
- Every mutation endpoint should be server-authoritative.
- `activity-sync` and action endpoints must be idempotent where relevant.

## `POST /activity-sync`

Purpose:

- accept normalized activity from the mobile client
- dedupe repeated sync windows
- convert activity into grants
- return updated balances

Request:

```json
{
  "windows": [
    {
      "windowStart": "2026-03-31T00:00:00Z",
      "windowEnd": "2026-03-31T23:59:59Z",
      "steps": 8400,
      "floors": 12,
      "sourcePlatform": "ios",
      "sourceDeviceId": "device-1",
      "dedupeKey": "ios:2026-03-31:8400:12"
    }
  ],
  "clientCheckpoint": "2026-03-31T23:59:59Z"
}
```

Response:

```json
{
  "acceptedWindows": 1,
  "duplicateWindows": 0,
  "grants": {
    "supplies": 84,
    "stone": 12
  },
  "balances": {
    "supplies": 120,
    "stone": 14
  },
  "snapshot": {
    "settlement": {
      "id": "settlement-id",
      "name": "New Haven",
      "milestoneLevel": 1,
      "balances": {
        "supplies": 120,
        "stone": 14
      }
    },
    "tiles": [],
    "buildings": [],
    "activeQueueItem": null,
    "completedItems": []
  }
}
```

## `GET /settlement`

Purpose:

- return the home-screen snapshot

Response shape:

```json
{
  "settlement": {
    "id": "settlement-id",
    "name": "New Haven",
    "milestoneLevel": 1,
    "balances": {
      "supplies": 120,
      "stone": 14
    }
  },
  "tiles": [],
  "buildings": [],
  "activeQueueItem": null,
  "completedItems": []
}
```

## `POST /actions/build`

Purpose:

- start constructing a new building

Request:

```json
{
  "requestId": "req-build-001",
  "tileKey": "0,1",
  "buildingType": "workshop"
}
```

## `POST /actions/upgrade`

Purpose:

- start upgrading an existing building

Request:

```json
{
  "requestId": "req-upgrade-001",
  "buildingId": "building-id"
}
```

## `POST /actions/clear-tile`

Purpose:

- start clearing or unlocking an adjacent tile

Request:

```json
{
  "requestId": "req-clear-001",
  "tileKey": "1,0"
}
```

## Shared mutation response

For `build`, `upgrade`, and `clear-tile`, return:

```json
{
  "status": "accepted",
  "message": "Workshop construction started.",
  "snapshot": {
    "settlement": {
      "id": "settlement-id",
      "name": "New Haven",
      "milestoneLevel": 1,
      "balances": {
        "supplies": 80,
        "stone": 14
      }
    },
    "tiles": [],
    "buildings": [],
    "activeQueueItem": {
      "id": "queue-id",
      "actionType": "build",
      "targetType": "building",
      "completeAt": "2026-04-01T08:00:00Z"
    },
    "completedItems": []
  }
}
```

Rejected mutations should return a stable error code and human-readable message.

For the MVP, returning the full settlement snapshot keeps the mobile cache simple:

- one accepted mutation can immediately refresh the whole home screen
- SQLite cache writes stay single-record and snapshot-oriented
- we can narrow responses later if payload size becomes a real problem

## `POST /internal/resolve-queue-item`

Purpose:

- resolve one due queue item
- atomically update queue state and building/tile state

This is not a mobile-facing endpoint.

## Notes

- `stone` is optional bonus depth in MVP. The client must not assume it exists on
  every device or account.
- `GET /settlement` should stay home-screen friendly. One request, one snapshot.
- The mobile client should never write economy tables directly.
- During local prototype development, edge functions may accept
  `x-player-auth-user-id` to bind requests to a deterministic demo player.
