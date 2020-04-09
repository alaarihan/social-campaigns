const puppeteer = require('puppeteer')
const os = require('os')
const log = require('./apiQueries/log')
const getSetting = require('./apiQueries/getSetting')
const getLogs = require('./apiQueries/getLogs')
const updateInactiveAccountsState = require('./apiQueries/updateInactiveAccountsState')
const changeAccountStatus = require('./apiQueries/changeAccountStatus')
const {
	login,
	clickAds,
	// removeAntibot,
	updateCredit,
	checkIfBonustoClickPuzzle
} = require('./actions')
const { getCurrentAccount } = require('./setAccount')

var runMode = process.env.HEADLESS === 'no' ? false : true
const hostName = os.hostname()
const startEarning = async function(force) {
	if (!force) {
		let lastCreatedAt = new Date()
		lastCreatedAt.setMinutes(lastCreatedAt.getMinutes() - 4)
		const lastLogsFromThisMachine = await getLogs({
			created_at: { _gt: lastCreatedAt },
			host_name: { _eq: hostName }
		}, false, 1)
		if (lastLogsFromThisMachine && lastLogsFromThisMachine.length > 0) {
			console.log(`Can't run earning because it seems still running already`)
			return false
		}
	}
	const browser = await puppeteer.launch({
		headless: runMode,
		defaultViewport: null,
		args: ['--no-sandbox', '--disable-features=site-per-process']
	}).catch(err => {
		log(`Couldn't lounch the browser ${err.message}`)
		return err
	})
	try {
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
			log('No available offline account found!')
			await browser.close()
			return false
		}
		log('Going to earn page')
		await page.goto('https://www.like4like.org/user/earn-youtube-video.php')
		await page.waitFor(2000)
		if (
			page.url() === 'https://www.like4like.org/login/verify-email.php'
		) {
			log('Need email verification!')
			await changeAccountStatus(account.id, 'NEED_EMAIL_VERIFY')
			await browser.close()
			return false
		}
		await checkIfBonustoClickPuzzle(page)
		await page
			.waitForSelector('.earn_pages_button', { timeout: 7000 })
			.catch(async error => {
				log('Click load more button')
				await page.click('#load-more-links').catch(async error => {
					log("Couldn't click load more button!", 'ERROR')
					await page.goto(
						'https://www.like4like.org/user/earn-youtube-video.php'
					)
					await page.waitFor(2000)
				})
			})
		await page
			.waitForSelector('#refcred a', { timeout: 1000, visible: true })
			.then(async () => {
				log('Collect refunded credit')
				await page.click('#refcred a')
				await page.waitFor(2000)
			})
			.catch(error => {
				console.log('')
			})
		await updateCredit(page, account, false)
		let loopNumber = await getSetting('loopNumber')
		if (!loopNumber || !loopNumber.value) {
			loopNumber = { value: 3 }
		}
		log(`Start the loop ${loopNumber.value} total`)
		for (let index = 0; index < loopNumber.value; index++) {
			await page.waitFor(1000)
			// await removeAntibot(page)
			// await page.waitFor(2000)
			await clickAds(page, browser)
			log('Click load more button')
			let errorText = false
			await page.click('#load-more-links').catch(async error => {
				const bonusClicked = await checkIfBonustoClickPuzzle(page)
				if(!bonusClicked) {
					log(error.message, 'ERROR')
					errorText = await page.evaluate(
						() => document.querySelector('#error-text').innerText
					)
				}
			})
			if (errorText) {
				log(`Error text: ${errorText}`, 'ERROR')
				if (errorText.indexOf('suspended') !== -1) {
					let statusDuration = errorText.substring(
						errorText.lastIndexOf("the next ") + 9, 
						errorText.lastIndexOf(" minutes.")
					);
					statusDuration = statusDuration ?  parseInt(statusDuration) + 10 : 60 * 6
					await changeAccountStatus(account.id, 'YV_SUSPENDED', statusDuration)
					if (browser) {
						await browser.close()
					}
					await updateCredit(page, account)
					return false
				} else if (
					errorText.indexOf('No tasks are currently available') !== -1
				) {
					changeAccountStatus(account.id, 'DONE', 3 * 60)
					if (browser) {
						await browser.close()
					}
					await updateCredit(page, account)
					return true
				}
			}
		}
		await page.goto('https://www.like4like.org/user/earn-youtube-video.php')
		await updateCredit(page, account)

		await browser.close()
		changeAccountStatus(account.id, 'DONE', 3 * 60)
		log('Done!')
	} catch (err) {
		if (browser) {
			await browser.close()
		}
		await changeAccountStatus(account.id, 'OFFLINE', null)
		log(`Error happened in startEarning! ${err.message}`, 'ERROR')
		return err.message
	}
}

module.exports = startEarning
