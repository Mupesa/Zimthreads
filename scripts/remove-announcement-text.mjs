import { executeSql } from "../api/store.ts"

async function main() {
  console.log("Checking settings in Neon DB (project rapid-hill-42448439)...")
  const rows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'settings';")
  const currentSettings = rows[0]?.data || {}
  console.log("Current Neon settings:", JSON.stringify(currentSettings, null, 2))

  // Update announcementText to empty string in Neon DB
  const updatedSettings = {
    ...currentSettings,
    announcementText: "",
  }

  await executeSql(
    `
    INSERT INTO public.zimthreads_store (key, data, updated_at)
    VALUES ('settings', $1::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW();
    `,
    [JSON.stringify(updatedSettings)]
  )

  const verifyRows = await executeSql("SELECT data FROM public.zimthreads_store WHERE key = 'settings';")
  console.log("Updated Neon settings:", JSON.stringify(verifyRows[0]?.data, null, 2))
  console.log("SUCCESS: announcementText removed from Neon DB.")
}

main().catch((err) => {
  console.error("FATAL ERROR:", err)
  process.exit(1)
})
