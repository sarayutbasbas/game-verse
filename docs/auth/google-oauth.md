# Google OAuth / GameVerse

ใช้ OAuth client ประเภท **Web application** และ Better Auth base path `/api/auth`. สำหรับlocal3000:

| Google Console field | ใส่ค่า |
|---|---|
| Authorized JavaScript origins | `http://localhost:3000` |
| Authorized redirect URIs | `http://localhost:3000/api/auth/callback/google` |

Origin ไม่มีpathหรือtrailing slash. Redirectต้องตรงทั้งscheme/domain/port/path. ไม่ต้องเลือก “Use this client for an AI-powered agent” สำหรับloginGameVerse

รัน `npm run setup:env` แล้วแก้ในserver `.env` (อย่าส่งsecretในแชต): `BETTER_AUTH_URL=http://localhost:3000`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET`สุ่มอย่างน้อย32bytes. Clientbundleไม่มีsecret. ช่วงTestingเพิ่มGoogleaccountที่จะลองในtestusers/consentscreen

หากใช้ `http://127.0.0.1:3000` ให้เพิ่มoriginนั้นและredirect `http://127.0.0.1:3000/api/auth/callback/google` และตั้งbaseURLตรงกัน อย่าสลับoriginระหว่างflow

Deployment: ยังไม่มีdomainที่อนุมัติ. เมื่อมี `https://<your-domain>` ใส่originเดียวกันและredirect `https://<your-domain>/api/auth/callback/google`, ตั้งBETTER_AUTH_URLตรงกัน. ห้ามใช้placeholderเป็นURLจริง. ต้องเป็นhostingที่รองรับpersistentWebSocketพร้อมdisk/SQLitebackup หรือเลือกDBก่อนหลายinstances

GuestมือถือบนWi-Fiใช้LAN-IPตามREADME. GoogleOAuthบนมือถือไม่ควรใช้localhostของมือถือหรือprivate-IPที่Googleไม่อนุญาตเป็นredirect; ใช้HTTPSdomainที่ลงทะเบียนและเข้าถึงserverได้. ไม่เปิดtunnel/เผยแพร่ให้โดยไม่มีอนุมัติ

Sources: [BetterAuth Google setup](https://better-auth.com/docs/authentication/google), [Google web-server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server). เครื่องนี้ตั้งค่า credentials จริงแล้ว: ผู้ใช้ยืนยันล็อกอินและกลับเข้าเกมสำเร็จ และตรวจพบ Google account พร้อม session ใน server. Headless browser ตรวจปุ่มไปถึง Google sign-in ได้ แต่ไม่มีบัญชีที่ล็อกอินใน browser ทดสอบ; ยังไม่ได้ตรวจ cancel/Guest upgrade ผ่าน provider จริง

`npm run setup:env` สร้าง auth secret หรือใช้ development secret เดิมโดยไม่แสดงค่า และไม่ overwrite `.env` ที่มีอยู่. หลังใส่ Google credentials ให้ restart server; state/receipts กู้จาก SQLite แต่ต้องคง secret เดิมไว้
