const puppeteer = require('puppeteer')
const log = require('./apiQueries/log')
const {
	login,
	clickAds,
	removeAntibot,
	clickPuzzleMap,
	updateCredit
} = require('./actions')

var runMode = process.env.HEADLESS === 'no' ? false : true
const startEarning = async function() {
	const browser = await puppeteer.launch({
		headless: runMode,
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
		.waitForSelector('.earn_pages_button', { timeout: 7000 })
		.catch(async error => {
			log('Click load more button')
			await page.click('#load-more-links').catch(async error => {
				log("Couldn't click load more button!", 'ERROR')
				await page.goto('https://www.like4like.org/user/earn-youtube-video.php')
				await page.waitFor(2000)
			})
		})
	await page.waitFor(2000)
	await removeAntibot(page)
	await updateCredit(page)
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
	await page.goto('https://www.like4like.org/user/earn-youtube-video.php')
	await updateCredit(page)

	await browser.close()
}

module.exports = startEarning
