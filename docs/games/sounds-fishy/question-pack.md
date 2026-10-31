# ชุดความรู้โลกระดับยาก — 30 ตุลาคม 2026

เปลี่ยนโจทย์ใหม่ครบ 200 ข้อจากชุดมุกคำไทย เป็นความรู้ทั่วโลกที่เน้นศัพท์เฉพาะ รายละเอียดทางประวัติศาสตร์ ตัวเลขที่กำหนดขอบเขตชัด และหลักวิชาที่ใช้ในการเรียนระดับอุดมศึกษา คละ 10 หมวด หมวดละ 20 ข้อ ความยากเป็นการเลือกเนื้อหาสำหรับเกม ไม่ใช่ข้อสอบหรือการรับรองระดับจากมหาวิทยาลัย

ข้อมูลจริงอยู่ใน [questions.json](../../../src/games/sounds-fishy/questions.json) ทุกข้อมี source ซึ่งแสดงเป็นลิงก์เมื่อจบรอบ ทั้งคำถามและคำตอบเรียบเรียงใหม่ แหล่งข้อมูลใช้ตรวจข้อเท็จจริง ไม่ได้คัดลอกชุดคำถามเชิงพาณิชย์

## แนวทางตรวจข้อมูล

- ระบุปีปฏิทินเป็น ค.ศ. และแยกปีลงนามออกจากปีมีผลใช้บังคับ เช่น สนธิสัญญาแวร์ซาย 1919 กับการเริ่มสันนิบาตชาติ 1920
- ข้อมูลสถิติต้องมีขอบเขตและช่วงเวลา เช่น ความยาวกำแพงเมืองจีนรวมหลายยุคตามผลสำรวจปี 2012 ไม่ใช่เฉพาะกำแพงราชวงศ์หมิงหรือแนวกำแพงที่เดินต่อเนื่องกันทั้งหมด
- สัตว์ระบุชนิดที่ถูกต้อง เช่น Bee hummingbird (Mellisuga helenae) ไม่ใช้เพียงชื่อกลุ่มกว้าง ๆ ว่าฮัมมิงเบิร์ด
- สูตรและทฤษฎีระบุสมมติฐานที่มีผลต่อคำตอบ เช่น เมทริกซ์จริง การแจกแจงภายใต้ตัวอย่างอิสระและความแปรปรวนจำกัด หรือค่ามวลขั้นต่ำจาก radial velocity
- ใช้ค่าประมาณเมื่อเหมาะสม เช่น ขีดจำกัดจันทรเศขรประมาณ 1.4 มวลดวงอาทิตย์ และ CMB ประมาณ 2.725 K ส่วนค่าคงที่ SI ที่นิยามให้เที่ยงตรงระบุให้ชัด
- คำศัพท์มีชื่อไทยและชื่อสากลในเฉลยเมื่อช่วยลดความสับสน การพูดชื่อภาษาอังกฤษที่มีความหมายตรงกันยังเป็นคำตอบเดียวกันในวงเล่น
- คำถามเทคนิคใช้เอกสารมาตรฐาน ตำราเผยแพร่โดยผู้เขียน/มหาวิทยาลัย และหน่วยงานวิชาการเป็นหลัก ไม่ใช้ตัวอย่างโจทย์โรงเรียนมาเพิ่มเพียงคำยากหรือมุกหยอด

## แหล่งตรวจหลัก

| กลุ่ม | ตัวอย่างแหล่งข้อมูล |
| --- | --- |
| ประวัติศาสตร์ | [NPS: Manhattan Project](https://www.nps.gov/mapr/learn/manhattan-project.htm), [UN Geneva: Covenant](https://www.ungeneva.org/en/about/league-of-nations/covenant), [National Archives: Partition](https://www.nationalarchives.gov.uk/education/teaching-resources/partition-of-british-india/) |
| ธรณีและภูมิศาสตร์ | [หน่วยงานมรดกปักกิ่ง: ผลสำรวจกำแพงปี 2012](https://wwj.beijing.gov.cn/bjww/resource/cms/article/bjww_362762/10985749/2021051314333734528.pdf), [USGS: โครงสร้างโลก](https://pubs.usgs.gov/gip/interior/), [NOAA: การไหลเวียนมหาสมุทร](https://oceanservice.noaa.gov/education/tutorial_currents/05conveyor1.html) |
| ชีววิทยา | [NHGRI: Genetics Glossary](https://www.genome.gov/genetics-glossary), [San Diego Zoo: Hummingbirds](https://animals.sandiegozoo.org/animals/hummingbird) |
| ดาราศาสตร์ | [NASA: Black Hole Anatomy](https://science.nasa.gov/universe/black-holes/anatomy/), [NASA: Exoplanet methods](https://science.nasa.gov/resource/the-search-for-other-earths-fact-sheet/) |
| ฟิสิกส์ | [BIPM: SI constants](https://www.bipm.org/en/measurement-units/si-defining-constants), [LIGO: Detection](https://www.ligo.caltech.edu/detection) |
| เคมี | [IUPAC Gold Book](https://goldbook.iupac.org/terms/view/E02069), [OpenStax Organic Chemistry](https://openstax.org/books/organic-chemistry/pages/11-2-the-sn2-reaction) |
| คณิตศาสตร์และสถิติ | [MIT: Linear Algebra notes](https://ocw.mit.edu/courses/18-085-computational-science-and-engineering-i-summer-2020/8e58e55c81809d673d9a29ac6422fc8d_MIT18_085Summer20_lec_w1.pdf), [NIST: Hypothesis tests](https://www.itl.nist.gov/div898/handbook/eda/section3/eda35.htm) |
| คอมพิวเตอร์ | [RFC 8200](https://datatracker.ietf.org/doc/html/rfc8200), [FIPS 197](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.197.pdf), [NIST algorithms](https://xlinux.nist.gov/dads/HTML/dijkstraalgo.html) |
| เศรษฐศาสตร์และสถาบัน | [IMF: SDR valuation 2022–2027](https://www.imf.org/en/news/articles/2022/07/29/pr22281-press-release-imf-determines-new-currency-amounts-for-the-sdr-valuation-basket), [ICJ: Composition](https://api.icj-cij.org/sites/default/files/documents/the-court-at-a-glance-en.pdf) |
| อารยธรรมและศิลปะ | [Cambridge: Linear B](https://www.classics.cam.ac.uk/research/projects/mycep/decipherment), [UNESCO: Bisotun](https://whc.unesco.org/en/list/1222/), [APSARA: Angkor Wat](https://apsaraauthority.gov.kh/2021/06/14/angkor-wat/), [National Gallery glossary](https://www.nationalgallery.org.uk/paintings/glossary/chiaroscuro) |

## การเปลี่ยนชุดโดยไม่เปลี่ยนเฉลยกลางเกม

เกมใหม่บันทึกชื่อชุด `world-advanced-2026-10-30` ไว้ใน state สำหรับการกู้คืน หากพบเกมเดิมที่ไม่มี field นี้ จะอ่านจากชุดเดิมที่เก็บไว้เพื่อความเข้ากันได้ เมื่อหัวห้องเริ่มใหม่จะสร้างกองจากชุดยาก 200 ข้อทั้งหมด ไม่ผสมคำถามเก่า ไม่เปลี่ยนกติกาจับปลา การสุ่มบทบาท หรือตารางคะแนน
