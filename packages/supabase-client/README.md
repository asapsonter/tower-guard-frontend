# @tower-guard/supabase-client

Initialized Supabase client shared by all 4 Tower Guard apps.

## Usage

```ts
import { supabase } from "@tower-guard/supabase-client";

const { data, error } = await supabase.from("incidents").select("*");
```

## Required env

Each consuming app must set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY`)

If they're missing, the package throws a readable error on import.
