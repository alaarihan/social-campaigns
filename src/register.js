require('dotenv').config()
const puppeteer = require('puppeteer')

var runMode = process.env.HEADLESS === 'no' ? false : true
async function registerNewAccount() {
	const browser = await puppeteer.launch({
		headless: false,
		defaultViewport: null,
		slowMo: 10,
		args: ['--no-sandbox', '--disable-setuid-sandbox']
	})

	let page = await browser.pages()
	page = page[0]
	await page.goto('https://www.like4like.org/login/register.php')
	await page.waitForSelector('#username')
	const iframe = await page.frames()[1]
	await page.waitFor(7000)
	await iframe.click('.recaptcha-checkbox')
	await page.waitFor(100000)
}

registerNewAccount()
