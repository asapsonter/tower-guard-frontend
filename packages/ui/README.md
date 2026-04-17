# @tower-guard/ui

Shared shadcn/ui component library used by all 4 Tower Guard apps.

## Contents

- 49 shadcn primitives (Button, Card, Dialog, Sheet, Sidebar, Form, Table, ...)
- `cn()` utility (re-export of `clsx + tailwind-merge`)
- `useToast`, `useIsMobile` (the shadcn-coupled hooks live here, not in `@tower-guard/hooks`, to avoid a circular dep)

## Usage

```ts
import { Button, Card, useToast } from "@tower-guard/ui";
import { cn } from "@tower-guard/ui/utils";
```

## Theming

Apps consume the Tailwind preset from `@tower-guard/config/tailwind-preset` and override accent CSS variables in their own `globals.css`.
