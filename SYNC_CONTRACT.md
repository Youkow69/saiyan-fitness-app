# Sync Contract v2.0 — Saiyan Ecosystem

## localStorage keys used for cross-app sync

### Written by Saiyan Steps, read by Saiyan Fitness
- `saiyan_tracker_sync`: JSON object
  ```json
  {
    "version": 2,
    "date": "YYYY-MM-DD",
    "timestamp": 1234567890,
    "steps": 8500,
    "sleepHours": 7.5,
    "waterGlasses": 6
  }
  ```

### Written by Saiyan Fitness, read by Saiyan Steps
- `saiyan_fitness_sync`: JSON object (future use)
  ```json
  {
    "version": 2,
    "date": "YYYY-MM-DD",
    "timestamp": 1234567890,
    "workoutToday": true,
    "caloriesLogged": 2100,
    "proteinHit": true
  }
  ```

### Shared localStorage keys
- `sf_theme`: "dark" | "light" — theme preference
- `sf_local_mode`: "1" | absent — local-only mode flag

## Supabase tables (cloud sync)
- `app_state`: Full app state per user (upsert on user_id)
- `steps_sync`: Daily steps/sleep/water per user per date
- `profiles`: Display name per user
- `progress_photos`: Photo metadata per user

## Conflict resolution
- Workouts are merged by ID (no duplicates)
- Profile uses most recent timestamp
- In case of conflict, local data is preserved + cloud-only data is added

## Versioning
- Sync payload includes a `version` field
- If version mismatch, the newer version's schema is used
- Old fields are preserved even if new schema doesn't use them
