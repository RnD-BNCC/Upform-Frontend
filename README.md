# UpForm FE

React + TypeScript + Vite

## Getting Started

```bash
cp .env.example .env
npm install
npm run dev
```

## Project Structure

```
src/
├── config/
│   ├── api-client.ts   # Axios instance + interceptors
│   ├── react-query.ts  # QueryClient config
│   └── routes.ts       # Route config array (tambah route di sini)
│
├── layouts/
│   └── RootLayout.tsx  # Base layout wrapper
│
├── pages/              # Page components (1 file = 1 halaman)
│
├── types/
│   └── route.ts        # Route type definition
│
├── hooks/              # Custom hooks
├── components/         # Shared/reusable components
│   └── ui/             # Base UI components
├── assets/
│   ├── icons/
│   └── images/
├── utils/              # Helper functions
│
├── App.tsx             # Router renderer
└── main.tsx            # Entry point + providers
```
