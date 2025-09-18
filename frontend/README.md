# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:


## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Backend Integration (FastAPI)

This frontend is wired to a FastAPI backend exposing these endpoints:

- POST `/identify`  body: `{ ph, tds, bitterness, sweetness }` -> returns `{ dravya, description, image }`
- GET `/search?name=<dravya>` -> same shape as identify
- POST `/research` body: `{ dravya, query }` -> returns `{ answer }`

In the current UI, the form maps:

- pH -> `ph`
- TDS -> `tds`
- Turbidity -> `bitterness` (temporary mapping)
- Gas -> `sweetness` (temporary mapping)

Color Index & Temperature are collected but not yet sent (future model update). Adjust once backend expects these features.

### Environment Variable

Set API base URL (defaults to `http://localhost:8000` if unset):

Create `.env` (or `.env.local`) in `frontend/`:

```bash
VITE_API_URL=http://localhost:8000
```

### Running Both Services

1. Start backend (from `backend/`):
   ```bash
   uvicorn main:app --reload --port 8000
   ```
2. Start frontend (from `frontend/`):
   ```bash
   npm run dev
   ```
3. Open the Vite dev server URL (usually `http://localhost:5173`).

### Adjusting Feature Mapping
When backend model changes to accept full feature set, update payload in `src/App.tsx` (function `handleSubmit`) and ideally move logic into a helper inside `src/lib/api.ts`.

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
