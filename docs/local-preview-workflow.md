# Local Preview Workflow

## What was broken

The fragile part was not Expo export itself. The fragile part was detached
process startup on this Windows environment.

`Start-Process` repeatedly failed with a `Path/PATH` collision, which meant:

- preview servers sometimes never stayed alive;
- `localhost:8085` looked randomly broken;
- we kept re-discovering new launch variants instead of using one boring path.

## Root cause

Detached preview startup needed to bypass the default PowerShell launch path.

The reliable path here is:

- build the static Expo web export;
- start the local static server via `.NET ProcessStartInfo`;
- store the PID in `.preview/preview-server.pid`;
- health-check `http://127.0.0.1:8085` before declaring success.

## Commands

Run from the repo root:

```powershell
npm run preview:start
```

This does the boring safe path:

- starts the detached server from the current `apps/mobile/dist`;
- reuses an already healthy preview if one exists;
- health-checks `http://127.0.0.1:8085` before declaring success.

Open:

```text
http://localhost:8085
```

Other commands:

```powershell
npm run preview:build
npm run preview:status
npm run preview:stop
npm run preview:restart
npm run preview:start:live
npm run demo:seed
npm run demo:reset
```

Use `preview:restart` when you want a fresh export plus a clean server restart.

## Demo player workflow

For local live testing we keep one deterministic demo user wired through
`x-player-auth-user-id`.

Commands:

```powershell
npm run demo:reset
npm run demo:seed
```

- `demo:reset` clears the local demo user and re-seeds a fresh starter settlement.
- `demo:seed` loads the current settlement and prints a short summary.

## Notes

- `preview:start` defaults to `mock` mode.
- `preview:start:live` expects the local Supabase stack to be available.
- The preview server serves files from `apps/mobile/dist`, so rebuilding the
  export updates what the server shows.
