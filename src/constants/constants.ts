export const ENV_VARIABLES = {
  HOST: Deno.env.get("ADMIN_URL") || "",
  PASSWORD: Deno.env.get("ADMIN_PASSWORD") || "",
};
