const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const siteRoot = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(siteRoot, relativePath), "utf8");
}

function test(name, callback) {
  try {
    callback();
    process.stdout.write(`PASS ${name}\n`);
  } catch (error) {
    process.stderr.write(`FAIL ${name}\n${error.stack}\n`);
    process.exitCode = 1;
  }
}

test("الصفحة الرئيسية تعرّف بالمؤسسة برسالة تقنية محايدة", () => {
  const html = read("index.html");

  assert.match(html, /مؤسسة جودي الكوفة العلمية/);
  assert.match(html, /تحديث تقني مؤقت/);
  assert.doesNotMatch(html, /Blogger|مدونة|حذف|محذوف|قفل|مقفلة/iu);
});

test("صفحة الروابط تعرض جميع القنوات الرسمية المعتمدة", () => {
  const html = read("links.html");
  const officialLinks = [
    "https://www.instagram.com/judyalkufa",
    "https://www.youtube.com/@judyalkufa",
    "https://www.tiktok.com/@judyalkufa",
    "https://t.me/judyalkufa",
    "https://wa.me/9647718745996"
  ];

  assert.match(html, /للتواصل معنا/);
  for (const href of officialLinks) assert.ok(html.includes(href), `missing ${href}`);
  assert.match(html, /rel="canonical" href="https:\/\/www\.judyalkufa\.org\/links"/);
  assert.doesNotMatch(html, /Blogger|مدونة|حذف|محذوف|قفل|مقفلة/iu);
});

test("المسار القديم لصفحة التواصل ينتقل مؤقتًا إلى الرابط الدائم", () => {
  const config = JSON.parse(read("vercel.json"));
  const redirect = config.redirects.find((item) => item.source === "/p/links.html");

  assert.deepEqual(redirect, {
    source: "/p/links.html",
    destination: "/links",
    permanent: false
  });
  assert.equal(config.cleanUrls, true);
});

test("الروابط غير المتاحة تبقى داخل هوية المؤسسة", () => {
  const html = read("404.html");

  assert.match(html, /مؤسسة جودي الكوفة العلمية/);
  assert.match(html, /الصفحة غير متاحة مؤقتًا/);
  assert.match(html, /href="\/"/);
  assert.match(html, /href="\/links"/);
  assert.doesNotMatch(html, /Blogger|مدونة|حذف|محذوف|قفل|مقفلة/iu);
});

test("الحزمة تضيف ترويسات حماية أساسية لجميع الصفحات", () => {
  const config = JSON.parse(read("vercel.json"));
  const headers = Object.fromEntries(config.headers[0].headers.map((item) => [item.key, item.value]));

  assert.equal(config.headers[0].source, "/(.*)");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.equal(headers["X-Frame-Options"], "DENY");
});
