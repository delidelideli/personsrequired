// Central config — override SERVER_URL by setting VITE_SERVER_URL in .env
export const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001'
