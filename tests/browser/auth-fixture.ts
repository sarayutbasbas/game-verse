// Server-side fixtures only. These are NOT evidence of Google provider login.
import { DatabaseSync } from "node:sqlite";
import { Pool } from "pg";
import { appendFileSync, mkdirSync } from "node:fs";
import type { Page } from "@playwright/test";
import type { startServer } from "../../src/server/index.js";
export async function testAccount(
  page: Page,
  app?: Awaited<ReturnType<typeof startServer>>,
) {
  const url = new URL(page.url()).origin;
  const auth = await page.request.post(url + "/api/auth/sign-in/anonymous", {
    headers: { Origin: url },
    data: {},
  });
  if (!auth.ok()) throw Error("Guest fixture failed: " + (await auth.text()));
  const { user } = await auth.json();
  if (app) {
    const context = await app.auth.$context;
    await context.internalAdapter.updateUser(user.id, { isAnonymous: false });
  } else if (process.env.GAMEVERSE_E2E_DATABASE_URL) {
    const pool=new Pool({connectionString:process.env.GAMEVERSE_E2E_DATABASE_URL,max:1});
    const changed=await pool.query('UPDATE "user" SET "isAnonymous"=false WHERE id=$1 AND "isAnonymous"=true RETURNING id',[user.id]);
    if(changed.rowCount!==1)throw Error('Remote account fixture must be a freshly-created Guest');
    mkdirSync('data',{recursive:true,mode:0o700});
    appendFileSync('data/deploy-test-owners.jsonl',JSON.stringify({id:user.id})+'\n',{mode:0o600});
    await pool.end();
  } else {
    const db = new DatabaseSync("data/e2e-gameverse.sqlite");
    db.prepare("UPDATE user SET isAnonymous=0 WHERE id=?").run(user.id);
    db.close();
  }
  await page.reload();
}
