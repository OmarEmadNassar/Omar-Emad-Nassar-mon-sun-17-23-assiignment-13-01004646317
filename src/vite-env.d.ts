/// <reference types="vite/client" />

declare const Swal: {
  fire: (options: Record<string, unknown>) => Promise<{ isConfirmed: boolean }>;
};