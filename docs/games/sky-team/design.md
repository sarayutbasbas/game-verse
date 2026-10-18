# Sky Team presentation

Cockpit-theme palette: petroleum#183c49, sky#55b9ec, amber#f5ad5e, ivory#f8edcf, instrument charcoal#102e38. ใช้fontไทยกลางเดิม. จอกลางหน้าต่างรันเวย์ด้านบน, approach/altitudeแนวนอน, attitudeซ้ายและcontrolblocksขวา; iPad/phoneเรียงเป็นกระดานเดียว. กรอบฟ้า/Pilotและส้ม/Co-pilotมีP/C+ชื่อกำกับ ไม่พึ่งสีอย่างเดียว. Mobileเป็นtap die→adjustcoffee→tap legalspace→privatepreview→fixedbottomconfirm; ปุ่ม44px, no drag. Previewหายเมื่อrevisionเปลี่ยนพร้อมข้อความ และไม่แชร์ก่อนcommit. ไม่ทำchat/ping.

Generated artworkใหม่9ชิ้นด้วยbuilt-in image_gen: cover, panel, runway, airplane, pilot, copilot, traffic, success, failure. รวมประมาณ895KB. Mappingในasset-manifest.json; ไฟล์จริงpublic/art/sky-teamและpublic/art/covers/sky-team.webp. ภาพไม่บรรจุตัวเลข/ข้อความกติกา; SVGdiepips/axis/track/labelsมาจากauthorizedprojection. Decorativeimagesโหลดไม่สำเร็จซ่อนแล้วใช้panelcolor/ชื่อและสัญลักษณ์codeที่ยังเล่นได้.

Prompt set: stylized-concept, original painterly/gouache aviation illustration, teal/cyan/amber/ivory, dawn, no text/logos/copying originalbox; coverportraitairlinerapproach; panelmattemetalonly; runwayMontreal-inspireddawnlandscape; airplane3/4transparentcutout; pilotAsianmanwithheadset/cyanuniform; copilotwomanwithheadset/amberaccent; traffictopdownivoryplanetransparent; successsafetouchdown; failureparkedserviceaproncloudydusk. ไม่มีค่าระบบหรือหน้าลูกเต๋าในภาพ.

Motionตามsequence/revisionที่ยืนยัน: private rollเฉพาะowner, newlycommittedslot, axisrotate, speedhighlight, approachtranslation, trafficfade, altitudechange, switchactivation, finalresult. RetainedkeyedDOMไม่เปลี่ยนทั้งshellเมื่อเลือก/ACK. Snapshot/reconnect/duplicateไม่มีreplay; reducedmotionปิดmotion. Stateไม่ขึ้นกับtimerหรือanimationend. ใช้sharedoptionalWebAudiosoundsเฉพาะpubliccommit/round/finish; ไม่ส่งเสียงตามค่าหรือsubsetของprivatedice. BG/SFXเปิดปิดแยกตามระบบเดิม.


คำสั่งพร้อมและยืนยันsubsetrerollผูกepochกับmatchId/round/serialของtoken โดยยอมรับrevisionเก่าที่ไม่ติดลบเฉพาะdecisionเดิมที่ยังเปิดอยู่. Engineยังตรวจauthenticatedactor/intent/subsetทุกครั้ง, ไม่รับfuture revision, tokenเก่า, roundเก่า หรือคำสั่งวางเต๋าเก่า. การตอบrerollของอีกฝ่ายไม่ล้างsubsetที่กำลังเลือกในมือถือ ถ้าepochยังเดิม. Epochนี้ไม่ใช่sessioncredential.

## Verification artifacts

ตรวจภาพจริง `data/qa-sky-team/` ครบportal/planning/cockpitdesktop/iPad/mobilebothroles/privatepreview/roundresolution/success/failure. Browserfullsuccessใช้isolatedserverที่injectdeterministicdice; actualDocker5555ผ่านlobby/privaterolls/placementsถึงfailure. Protocoltestกู้SQLiteระหว่างrerollยืนยันบางคนแล้ว และตรวจthirdseat/receipts/stalerevision/epoch/privacy. Buildและregression166ผ่าน/2Postgresข้าม. ยังไม่ได้ทดสอบอุปกรณ์Safariจริง.
