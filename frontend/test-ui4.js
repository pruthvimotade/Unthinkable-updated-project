import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  await page.goto('http://localhost:5173/register');
  
  await page.waitForSelector('input[name="name"]');
  await page.type('input[name="name"]', 'Puppeteer User');
  await page.type('input[name="email"]', 'puppeteer4@example.com');
  await page.type('input[name="phone"]', '9123456789'); // unique phone
  await page.type('input[name="password"]', 'Password123!');
  await page.type('input[name="confirmPassword"]', 'Password123!');
  
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 4000));
  
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("BODY TEXT SNIPPET:", bodyText.substring(0, 500));
  
  await browser.close();
})();
