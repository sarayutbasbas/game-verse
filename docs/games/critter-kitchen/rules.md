# Critter Kitchen — base game multiplayer (Cardboard Alchemy 2024)

ฉบับ: Cardboard Alchemy ©2024, ภาคหลัก 2–5 คน (เกมจริง1–5 แต่เว็บงานนี้ไม่รวมSolo). ไม่รวมÀ La Cart/6–7คน/promos/deluxe-extra gameplay. ร้านอาหารและchefsหลักใช้กติกาเดียวกับretail; ภาพdeluxeเป็นเพียงreferenceรูปลักษณ์.

แหล่งหลักตรวจวันที่16ตุลาคม2026:
- https://cardboardalchemy.com/downloads/CritterKitchen_Rulebook.pdf (24หน้า, อ่านPDFและภาพsetup/scoretrackโดยตรง)
- https://cardboardalchemy.com/critter-kitchen/ (จำนวนผู้เล่นและข้อมูลผู้จัดพิมพ์)
- คู่มือหน้า23–24มีclarifications; ตรวจข้อความการ์ดจากภาพชิ้นส่วนต้นฉบับประกอบ ไม่ถือข้อความแปลแฟนเป็นกติกาทางการ

## ตาราง setup differences (ยืนยันจากหน้า4–5 / 7)

| ผู้เล่น | numbered locations | ลำดับรวมซ้าย→ขวา | Merchant/Academy | Academyเติมเริ่มรอบ | chefsหลัก/คน | cardsตำแหน่ง/คน |
|---|---|---|---|---|---|---|
| 2 | #1 Garden Top Shop, #2 Desert Vendor | Soup, #1, #2, Midnight Merchant, Chef Academy | ด้าน2 | 2 randomitems | mouse1/lizard2/boar3 | 5 |
| 3 | #1–3 (+Water-Market) | Soup,#1,#2,#3,Merchant,Academy | ด้านปกติ | ไม่เติม | เช่นเดิม | 6 |
| 4 | #1–4 | Soup,#1,#2,#3,#4,Merchant,Academy | ด้านปกติ | ไม่เติม | เช่นเดิม | 7 |
| 5 | #1–5 | Soup,#1,#2,#3,#4,#5,Merchant,Academy | ด้านปกติ | ไม่เติม | เช่นเดิม | 8 |

5numberedboards,3specialboardsรวม8. การ์ดBreak Timeไม่ใช้ในmultiplayer. รอบ1เริ่มsoup1/คน,hatpriorityสุ่ม. 6challengecardsคว่ำจาก7; critic1เปิดจาก12; rumor3คว่ำจาก28; zous12shuffle. Restaurateur10เป็นoptionalmoduleในภาคหลัก (กำลังตรวจข้อความเต็ม). ถุง119oblongtokens=91ingredient(7ชนิด×13),spice16(2×8รวมallspice),rumor12(3×4รวมwild). Ingredientsแต่ละชนิดค่า[2,2,2,3,3,3,4,4,5,5,6,6,7]. Soup40ในกล่องเป็นsupplyไม่จำกัดตามกติกา, bisque7และspecialround7allspiceอยู่นอกถุง. ตรวจภาพกระดานแล้ว: numbered 3 ช่อง, Merchant 2 คน 3 ช่อง / 3+ คน 5 ช่อง, Academy 2 คน 2 ช่อง / 3+ ไม่เติมเริ่มรอบ.

## ข้อมูลเปิด/ปิด

| ข้อมูล | จอกลาง / คู่แข่ง | เจ้าของ | เปิดเมื่อ |
|---|---|---|---|
| plan chef→location | ไม่ส่ง | เห็นของตน | ทั้งคู่/ทุกคนcommitครบพร้อมกัน |
| ingredients/spices/soup/bisqueในstorage | ซ่อน | เห็น | เลือกปรุงแล้วpresentพร้อมกันตามขั้น |
| bag order / unused deckcards | ไม่ส่ง | ไม่ส่ง | จั่วตามขั้น |
| rumors3ใบ | คว่ำ เว้นแต่ทุกคนรู้/ท้ายเกม | เฉพาะใบที่tokenตนรู้ | ทุกคนรู้หรือfinalscoring |
| rumor-knownicons / publicstars / hiredzous | เห็น | เห็น | ตามการรับจริง |
| challenge/criticplatesระหว่างเตรียม | เว็บเลือกเตรียมลับตามสิทธิ์ที่คู่มืออนุญาต | เห็น | ทุกคนพร้อมจึงrevealพร้อมกัน |
| criticเปิด / challengesเปิดแล้ว / locationitems | เห็น | เห็น | ตามขั้นกติกา |

ไม่ใช้CSSซ่อนprivatestate. Modefullmobileไม่มีสิทธิ์เพิ่มเติม. Previewท้องถิ่นไม่broadcast.

## ขั้นรอบที่ตรวจแล้ว

7รอบ/3วัน. เริ่มรอบเติมbisqueถ้าไม่มี, เปิดchallengeถัดไป(รอบ7ไม่เปิด), เติมnumberedlocationsตามช่องจากถุง, 2คนเติมAcademy2ช่องด้วย, เปิดzousใหม่(รอบ7แทนด้วยspecialallspice). Merchantไม่เติมจนถึงresolutionของมัน. Holdปิดrightmostingredientของchallengeรอบ3/6.

Planningพร้อมกัน: chefหลัก3ตัวและzousที่รับรอบก่อน ต้องไปคนละlocationเพราะlocationcardแต่ละใบมี1. Revealแผนทุกคนพร้อมกันแล้วresolveSoup→numberedตามลำดับ→Merchant→Academy. queuecapacity1→2→3; ผู้เดียวในqueueหยิบครบcapacity, หลายคนหยิบทีละชิ้นวนตามpriority. เฉพาะผู้ชนะtieที่เป็นfirstactualpickของlocationเสียpriorityไปหลังสุด; tiequeueถัดมาไม่เลื่อนhat. ประเภทเชฟและความสามารถทั้งหมดดู catalog.json และ src/games/critter-kitchen/data.ts.

Ingredients/spiceเข้าหลังshield, soup/bisqueเช่นกัน. Rumorเลือกได้เฉพาะที่ยังไม่รู้;wildเลือก1ในช่องว่าง;ทุกคนรู้แล้วเปิดcardและdrawrumorชนิดนั้นจากถุงใหม่ทิ้งแล้วจั่วแทน. Chefที่กลับมือเปล่ารับconsolationsoup1ได้; เลือกกลับก่อนหยิบของได้. SoupTruckมีsoup1ไม่จำกัด+bisque3หนึ่งถ้ายังไม่ถูกหยิบ และleftoversก่อนหน้า. Merchantเติมตอนresolveแม้ไม่มีchef. Leftoveringredient/spiceทุกlocationย้ายAcademy, rumorทิ้ง; leftoversAcademyไปSoupTruck. Zousรับเป็น1itemใช้รอบถัดไปครั้งเดียว.

จบ3/6เตรียมchallengeพร้อมกัน3ใบ; ทำได้ใบละ1meal. ต้องมีอย่างน้อย1requiredrealingredient, substitutemissingrequiredtypeด้วยsoup/bisque1tokenต่อชนิดได้, เพิ่มของเฉพาะrequiredtypesได้ไม่จำกัด+soupเท่าไรก็ได้, spiceคู่ตรงชนิดหรือallspiceหนึ่งต่อingredientคูณ2. quality6–11/12–20/21+=1/2/4stars;ต่ำ6presentไม่ได้. ใช้ingredient/spiceคืนถุง soup/bisqueคืนsupply. แล้วเลือกเก็บingredient+spiceไม่เกิน5/10ตามวัน; soup/rumorไม่ติดlimit.

จบ7criticmeal: ปกติหนึ่งingredient+spiceต่อ7courses (bread,carrot,cheese,fish,meat,mushroom,wine), soupแทนไม่ได้. Criticอาจแก้กติกา. พร้อมทุกคนแล้วpresentพร้อมกัน. mostsoupvalue1star,ครบ7courses1star, bestqualityeachcourse1star, tiesfriendlyเต็มแต้ม. Rumorsเปิดทั้งหมดแล้วคิดทุกคนไม่ขึ้นกับรู้มาก่อน. Critic/restaurateurbonusตามcards. Qualityรวมscoretrack1–7=1star,8–14=2,...64–70=10;เกิน70รับ10แล้ววน(เช่น76=11stars). ชนะstarsรวม,เสมอดูqualityscoretrackprogress,ยังเสมอpriorityลำดับหน้า.

ผลตรวจ implementation / browser / assets แยกไว้ใน docs/progress.md เพื่อแยกกติกาที่อ้างอิงออกจากสถานะการทดสอบ.


## ข้อวินิจฉัยของเว็บที่ผู้ใช้ยืนยัน (16 ตุลาคม 2026)

แยกจากกติกาทางการ: หากไม่มีใครเสิร์ฟคอร์สนั้น ไม่แจกดาว Best of Course สำหรับคอร์สนั้น และต้องเสิร์ฟอย่างน้อยหนึ่งคอร์สจึงมีสิทธิ์รับโบนัส Nocturnal และ Odd Tastes ผู้ใช้ยืนยันผ่านคำถามในแชตแล้ว


## Catalog และแหล่งตรวจข้อความ

Catalog ครบ: 7 Challenge, 12 Critic, 12 Zous, 28 Rumor และ 10 Restaurateur ภาคหลัก (เลือกเปิดโมดูลในห้องรอ) รายละเอียดภาษาไทยและ stable ID อยู่ใน catalog.json ซึ่งสร้างจาก data.ts ไม่รวม promo หรือส่วนขยาย

ภาพการ์ดต้นฉบับอ่านจากชุดอ้างอิงที่ community host ใน TTS workshop https://steamcommunity.com/sharedfiles/filedetails/?id=3709598597 เทียบจำนวนและ clarifications หน้า23–24ของคู่มือผู้จัดพิมพ์ ไม่ถือเวิร์กช็อปเป็นผู้ประกาศกติกาทางการ ไม่รันสคริปต์ในเวิร์กช็อป และไม่ใช้ภาพเหล่านั้นเป็น artwork ของเว็บ

คำชี้แจงจากผู้ออกแบบ Peter C. Hayward: https://boardgamegeek.com/thread/3514910/sauce-question ใช้ตัวเลขที่พิมพ์สำหรับการจับคู่ไวน์ Fruit Bat และเงื่อนไขที่อ้างเลขเฉพาะ ส่วน Sauce เป็นส่วนขยาย ไม่เพิ่มเข้า engine ภาคหลักนี้

Raccoon: วัตถุดิบค่าพิมพ์ 2 เปิดเผยต่อทุกคน และไม่กินที่ตู้เย็น สูตรคำนวณกับข้อจำกัดของผู้วิจารณ์อื่นแยกใน scoring.ts. Herón ใช้เครื่องเทศซ้ำภายในจานเดียวกับวัตถุดิบชนิดเดียวกันได้ แต่ไม่ใช้โทเคนเดียวพร้อมกันข้ามจาน. ผลของเชฟที่รับของเพิ่มเติมประมวลผลก่อนตัดสินว่ากลับมือเปล่าหรือไม่. Marcus ประมวลผลเมื่อเข้าสู่ End of Round ก่อนเตรียมอาหาร ตามลำดับขั้นในคู่มือและข้อความการ์ด.
