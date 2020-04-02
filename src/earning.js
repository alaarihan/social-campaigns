const puppeteer = require('puppeteer')
const log = require('./apiQueries/log')
const updateInactiveAccountsState = require('./apiQueries/updateInactiveAccountsState')
const changeAccountStatus = require('./apiQueries/changeAccountStatus')
const {
	login,
	clickAds,
	removeAntibot,
	clickPuzzleMap,
	updateCredit
} = require('./actions')
const { getCurrentAccount } = require('./setAccount')

var runMode = process.env.HEADLESS === 'no' ? false : true
const startEarning = async function() {
	const browser = await puppeteer.launch({
		headless: runMode,
		defaultViewport: null,
		args: ['--no-sandbox', '--disable-features=site-per-process']
	})
	await updateInactiveAccountsState()
	let page = await browser.pages()
	page = page[0]
	if (!page) {
		await browser.close()
		return false
	}
	await login(page)
	var account = await getCurrentAccount()
	if (!account) {
		log('Waiting for an available offline account')
		await page.waitFor(240000)
		await updateInactiveAccountsState()
		await login(page)
		var account = await getCurrentAccount()
	}
	if (!account) {
		log('Done waiting but still no offline accounts! so abort!')
		await browser.close()
		return false
	}
	log('Going to earn page')
	await page.goto('https://www.like4like.org/user/earn-youtube-video.php')
	await page.waitFor(2000)
	if (page.url() === 'https://www.like4like.org/user/bonus-page.php') {
		await clickPuzzleMap(page, 'Bonus page')
		await page.goto('https://www.like4like.org/user/earn-youtube-video.php')
	} else if (
		page.url() === 'https://www.like4like.org/login/verify-email.php'
	) {
		log('Need email verification!')
		await changeAccountStatus(account.id, 'NEED_EMAIL_VERIFY')
		await browser.close()
		return false
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
	await updateCredit(page)
	for (let index = 0; index < 15; index++) {
		await page.waitFor(1000)
		await removeAntibot(page)
		await page.waitFor(2000)
		await clickAds(page, browser)
		log('Click load more button')
		await page.click('#load-more-links').catch(async error => {
			if (page.url() === 'https://www.like4like.org/user/bonus-page.php') {
				await clickPuzzleMap(page, 'Bonus page')
				await page.goto('https://www.like4like.org/user/earn-youtube-video.php')
			} else {
				log(error.message, 'ERROR')
			}
		})
	}
	await page.goto('https://www.like4like.org/user/earn-youtube-video.php')
	await updateCredit(page)

	await browser.close()
	await changeAccountStatus(account.id, 'OFFLINE')
	log('Done!')
}

module.exports = startEarning
