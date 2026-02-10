# Engine Integration

The frontend can use either the **V1** (Overpass + Mapbox) or **V2** (local matcher + per-edge coverage) GPX analysis engine. Switching is done via environment variable; the same UI and types are used for both.

## Environment: `VITE_GPX_ENGINE`

- **`v1`** (default): Analyze uses `POST /runs/analyze-gpx`; map uses `GET /map/streets` (legacy pipeline).
- **`v2`**: Analyze uses `POST /engine-v2/analyze`; map uses `GET /engine-v2/map/streets` (UserEdge-based progress).

Set in `frontend/.env` or `frontend/.env.local`:

```env
VITE_GPX_ENGINE=v2
```

If unset, the app defaults to `v1`. The value is read at build time via `import.meta.env.VITE_GPX_ENGINE` and exposed as `GPX_ENGINE` in `src/config/constants.ts`.

## Services That Switch

| Service       | V1 behavior                          | V2 behavior                          |
|---------------|--------------------------------------|--------------------------------------|
| **gpxService** | `analyze(file)` → `POST /runs/analyze-gpx` | `analyze(file, userId)` → `POST /engine-v2/analyze?userId=...` |
| **mapService** | `getMapStreets(lat, lng, radius)` → `GET /map/streets` | Same method → `GET /engine-v2/map/streets` (same response shape) |

No other frontend code needs to branch on the engine; callers use the same `gpxService.analyze()` and `mapService.getMapStreets()` APIs.

## Passing `userId` for V2

When `VITE_GPX_ENGINE=v2`, the backend requires a user ID to persist edges. The frontend must pass it into `gpxService.analyze(file, userId)`.

Use the authenticated user from auth context, for example:

```ts
const { user } = useAuth();
// ...
const result = await gpxService.analyze(file, user?.id);
```

If `userId` is missing when the engine is v2, `gpxService.analyze` throws with a clear error message.

## Response Normalization (V2 → GpxAnalysisResponse)

The V2 analyze endpoint returns a different shape (`EngineV2AnalyzeResponse`) than the legacy endpoint (`GpxAnalysisResponse`). So that the rest of the app can stay engine-agnostic, the GPX service normalizes V2 responses internally.

- **Where:** `mapV2ToGpxAnalysisResponse()` in `src/services/gpx.service.ts`.
- **What it does:** Maps `EngineV2AnalyzeResponse` (run, path, edges, streets, warnings) into the same `GpxAnalysisResponse` shape used by V1 (analysis, streets with list of aggregated streets).
- **Callers:** They always receive `GpxAnalysisResponse` from `gpxService.analyze()`, regardless of engine.

The `EngineV2AnalyzeResponse` type in `src/types/api.types.ts` documents the raw V2 response (run metadata, streets with `wayIds`, `edgesTotal`, `edgesCompleted`, `isComplete`, `completionPercent`). The normalizer converts that into the aggregated street list and analysis stats expected by the UI.

## Summary

- Set `VITE_GPX_ENGINE=v1` or `v2` in `frontend/.env` (or `.env.local`).
- Use `gpxService.analyze(file, user?.id)` and `mapService.getMapStreets(...)` as usual; when v2 is enabled, pass `userId` for analyze.
- The app consumes a single response type (`GpxAnalysisResponse`) for analyze; V2 responses are normalized in the GPX service before being returned.
