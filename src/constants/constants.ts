import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

// Завантажуємо змінні середовища з файлу .env
await load({ export: true, allowEmptyValues: true });

// Потім використовуємо змінні середовища
export const ENV_VARIABLES = {
  HOST: Deno.env.get("ADMIN_URL") || "",
  PASSWORD: Deno.env.get("ADMIN_PASSWORD") || "",
};