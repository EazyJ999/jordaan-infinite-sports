import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";

async function rememberAccounts() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  const { getSql } = await import("@/lib/db");
  const { pullAccounts, pushAccounts } = await import("@/lib/shared-accounts");
  const sql = await getSql();
  await pullAccounts(sql);
  return async () => {
    await pushAccounts(await getSql());
  };
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        await rememberAccounts();
        return auth.handler(request);
      },
      POST: async ({ request }) => {
        const save = await rememberAccounts();
        const response = await auth.handler(request);
        if (save) await save();
        return response;
      },
    },
  },
});
