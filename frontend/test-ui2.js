import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('requestfailed', request => {
    console.error('REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  await page.goto('http://localhost:5173/register');
  console.log("Navigated to register");
  
  await page.waitForSelector('input[name="name"]');
  await page.type('input[name="name"]', 'Puppeteer User');
  await page.type('input[name="email"]', 'puppeteer2@example.com');
  await page.type('input[name="phone"]', '9876543210');
  await page.type('input[name="password"]', 'Password123!');
  await page.type('input[name="confirmPassword"]', 'Password123!');
  
  await page.click('button[type="submit"]');
  console.log("Submitted form, waiting for response...");
  
  await page.waitForTimeout(3000);
  
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("BODY TEXT SNIPPET:", bodyText.substring(0, 300));
  
  await browser.close();
})();
