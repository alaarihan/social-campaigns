const puppeteer = require('puppeteer')
import { log } from './apiQueries'
import { login, clickAds, removeAntibot, clickPuzzleMap } from './actions'

const startEarning = async function() {
	const browser = await puppeteer.launch({
		headless: false,
		defaultViewport: null,
		args: ['--no-sandbox', '--disable-setuid-sandbox']
	})
	let page = await login(browser)
	if (!page) return false
	log('Going to earn page')
	await page.goto('https://www.like4like.org/user/earn-youtube-video.php')
	await page.waitFor(2000)
	if (page.url() === 'https://www.like4like.org/user/bonus-page.php') {
		await clickPuzzleMap(page)
		await page.waitFor(2000)
		await page.goto('https://www.like4like.org/user/earn-youtube-video.php')
	}
	await page
		.waitForSelector('.earn_pages_button', { timeout: 5000 })
		.catch(async error => {
			log('Click load more button')
			await page.click('#load-more-links')
		})
	await page.waitFor(2000)
	await removeAntibot(page)
	await page.waitFor(2000)
	for (let index = 0; index < 10; index++) {
		await clickAds(page, browser)
		log('Click load more button')
		await page.click('#load-more-links').catch(async error => {
			if (page.url() === 'https://www.like4like.org/user/bonus-page.php') {
				await clickPuzzleMap(page)
				await page.waitFor(2000)
				await page.goto('https://www.like4like.org/user/earn-youtube-video.php')
			} else {
				log(error.message, 'ERROR')
			}
		})
		await page.waitFor(2000)
	}

	await browser.close()
}

module.exports = startEarning