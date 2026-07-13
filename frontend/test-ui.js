import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('requestfailed', request => {
    console.error('REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  await page.goto('http://localhost:5173/');
  console.log("Navigated to home");
  
  // click "Create an account" or navigate to register
  await page.goto('http://localhost:5173/register/customer');
  console.log("Navigated to register");
  
  await page.waitForSelector('input[name="name"]');
  await page.type('input[name="name"]', 'John Doe');
  await page.type('input[name="email"]', 'johndoe123@example.com');
  await page.type('input[name="phone"]', '9876543210');
  await page.type('input[name="password"]', 'Password123!');
  await page.type('input[name="confirmPassword"]', 'Password123!');
  
  await page.click('button[type="submit"]');
  console.log("Submitted form, waiting for response...");
  
  await page.waitForTimeout(3000); // wait for toast or error
  
  // check for toast or error text
  const bodyText = await page.evaluate(() => document.body.innerText);
  if (bodyText.includes("An error occurred during registration")) {
    console.log("FOUND EXACT ERROR: An error occurred during registration.");
  } else {
    console.log("Error text not found. Body snippet:", bodyText.substring(0, 300));
  }
  
  await browser.close();
})();
