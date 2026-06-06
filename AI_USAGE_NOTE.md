# AI Usage Note

## How AI Was Used

AI was used to accelerate the initial implementation of the schema monitoring backend, the React dashboard scaffold, and the prompt templates for Ollama-driven analysis.

## What AI Generated

The first-pass codebase included the FastAPI services, drift comparison logic, AI analysis client, migration generator, Discord notifier, React pages, and JSON report handling.

## What AI Got Wrong

The first draft needed human review for SQLite-specific migration behavior, rename heuristics, fallback behavior when Ollama is unavailable, and report persistence details.

## Improvements Made Manually

The project was tightened into a consistent service-oriented layout, defensive fallback logic was added, and the frontend was simplified into a responsive, readable dashboard suitable for a hackathon demo.

## Best Prompts Used

The most effective prompts were the impact analysis prompt with strict JSON output requirements and the migration generation prompt that constrained output to SQL migration, compatibility views, and rollback scripts.
