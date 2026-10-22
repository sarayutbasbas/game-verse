# Google OAuth / GameVerse

ใช้ OAuth client ประเภท **Web application** และ Better Auth base path `/api/auth`. สำหรับlocal3000:

| Google Console field | ใส่ค่า |
|---|---|
| Authorized JavaScript origins | `http://localhost:3000` |
| Authorized redirect URIs | `http://localhost:3000/api/auth/callback/google` |

Docker local ใช้ URL แยกที่ **http://localhost:5555**. เพิ่มสองรายการนี้ใน OAuth client เดิม โดยคง dev/production เดิมไว้:

เครื่องนี้ตั้ง Docker ผ่าน **https://bn-games.basnana.com** แล้ว: `BETTER_AUTH_URL` และ `GAMEVERSE_JOIN_ORIGIN` ใช้โดเมนนี้. เพิ่ม origin `https://bn-games.basnana.com` และ redirect `https://bn-games.basnana.com/api/auth/callback/google` ใน OAuth client ที่ตรงกับ `.env.docker`. Google login ให้เปิดผ่านโดเมนนี้; ไม่สลับไป localhost ระหว่าง flow. ตรวจ browser ล่าสุด authorization request ใช้ callback ของโดเมนใหม่และไม่พบ redirect mismatch; การเข้าบัญชีจนกลับเข้าเกมยังต้องให้ผู้ใช้ยืนยัน.

| Google Console field | ใส่ค่าเพิ่มเติม |
|---|---|
| Authorized JavaScript origins | `http://localhost:5555` |
| Authorized redirect URIs | `http://localhost:5555/api/auth/callback/google` |

`npm run docker:rebuild` สร้าง `.env.docker` ส่วนตัวครั้งแรกจากเฉพาะ Google credentials ใน `.env` และ secret ใหม่. ครั้งต่อไปไม่เปลี่ยน secret; ใช้ฐานข้อมูล/คุกกี้แยกจาก dev. การล็อกอิน Google ต้องใช้ origin ให้ตรงกับ `BETTER_AUTH_URL` ใน Docker (ค่าเริ่มต้น localhost:5555; เครื่องนี้เปลี่ยนเป็น bn-games.basnana.com แล้ว) ไม่สลับไป LAN IP ระหว่าง flow. Browser fixture ไม่ถือว่าผ่าน provider จริง.

เพิ่ม callback ใน OAuth client ที่ Client ID ตรงกับ `GOOGLE_CLIENT_ID` ใน `.env.docker`. ตรวจเมื่อ 2026-10-14 พบว่า dev/Docker ใช้คนละ client กับ production และ Docker ยังได้รับ `redirect_uri_mismatch` แม้ผู้ใช้เพิ่ม callback แล้ว. Production credentials เป็น Vercel Secret ที่อ่านคืนไม่ได้; ไม่คัดลอก placeholder แทน key จริง. หากต้องการใช้ client ของ production ให้ใส่ key ของ client นั้นโดยตรงใน private `.env.docker` แล้ว rebuild โดยไม่ส่ง secret ในแชต.

Origin ไม่มีpathหรือtrailing slash. Redirectต้องตรงทั้งscheme/domain/port/path. ไม่ต้องเลือก “Use this client for an AI-powered agent” สำหรับloginGameVerse

รัน `npm run setup:env` แล้วแก้ในserver `.env` (อย่าส่งsecretในแชต): `BETTER_AUTH_URL=http://localhost:3000`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET`สุ่มอย่างน้อย32bytes. Clientbundleไม่มีsecret. ช่วงTestingเพิ่มGoogleaccountที่จะลองในtestusers/consentscreen

หากใช้ `http://127.0.0.1:3000` ให้เพิ่มoriginนั้นและredirect `http://127.0.0.1:3000/api/auth/callback/google` และตั้งbaseURLตรงกัน อย่าสลับoriginระหว่างflow

Production: `https://games.basnana.com`; Authorized JavaScript origins = `https://games.basnana.com`; Authorized redirect URIs = `https://games.basnana.com/api/auth/callback/google`. ตั้ง `BETTER_AUTH_URL` ตรงกัน. ผู้ใช้ยืนยันเพิ่มแล้ว. คง localhost/โดเมน vercel.app เดิมไว้ได้; ดู runtime Vercel + Neon Free ใน docs/vercel-deployment.md.

GuestมือถือบนWi-Fiใช้LAN-IPตามREADME. GoogleOAuthบนมือถือไม่ควรใช้localhostของมือถือหรือprivate-IPที่Googleไม่อนุญาตเป็นredirect; ใช้HTTPSdomainที่ลงทะเบียนและเข้าถึงserverได้. ไม่เปิดtunnel/เผยแพร่ให้โดยไม่มีอนุมัติ

Sources: [BetterAuth Google setup](https://better-auth.com/docs/authentication/google), [Google web-server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server). เครื่องนี้ตั้งค่า credentials จริงแล้ว: ผู้ใช้ยืนยันล็อกอินและกลับเข้าเกมสำเร็จ และตรวจพบ Google account พร้อม session ใน server. Headless browser ตรวจปุ่มไปถึง Google sign-in ได้ แต่ไม่มีบัญชีที่ล็อกอินใน browser ทดสอบ; ยังไม่ได้ตรวจ cancel/Guest upgrade ผ่าน provider จริง

`npm run setup:env` สร้าง auth secret หรือใช้ development secret เดิมโดยไม่แสดงค่า และไม่ overwrite `.env` ที่มีอยู่. หลังใส่ Google credentials ให้ restart server; state/receipts กู้จาก SQLite แต่ต้องคง secret เดิมไว้

## Production OAuth configuration repair (2026-10-22)

Google returned `401 invalid_client` because production sent a malformed Client ID rather than a Google Web OAuth client identifier. Checked the live authorization request without logging its state or credentials. The private local Google pair is recognized by Google's token endpoint (`invalid_grant` for an intentionally invalid code, rather than `invalid_client`), and its authorization request accepts `https://games.basnana.com/api/auth/callback/google` and reaches Google's sign-in page. Updated only production `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` through stdin as Vercel Secrets; preserved database configuration, canonical origins and the stable Better Auth session secret. A new production deployment is required to apply the replacement pair. Real Google account consent and successful callback remain distinct from these configuration checks.
