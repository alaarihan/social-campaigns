const { getNewAccount } = require('../setAccount')
const { loginBlockedStatuses } = require('../utils')
const {
	updateLastActivity,
	changeAccountStatus,
	log
} = require('../apiQueries')
async function login(page, account, changeStatus = true) {
	let accountSpecifyed = account ? true : false
	if (
		account &&
		account.status &&
		loginBlockedStatuses.includes(account.status)
	) {
		const accountError = `Can't login to account #${account.id} because its status is ${account.status}`
		log(accountError, 'ERROR')
		throw new Error(accountError)
	}
	if (!account) {
		account = await getNewAccount()
	}
	if (!account) {
		await log('No offline accounts available')
		return false
	}
	if (changeStatus) {
		await changeAccountStatus(account.id, 'ONLINE')
		updateLastActivity(account.id)
	}
	log(`Logging in to ${account.username} account`)
	await page.goto('https://www.like4like.org/login/')
	await page.waitForSelector('#username')
	await page.type('#username', account.username)
	await page.keyboard.down('Tab')
	await page.keyboard.type(account.password)
	await page.click('a[onclick="LoginFunctions();"]')
	await page
		.waitForSelector('a[href="https://www.like4like.org/user/"]', {
			timeout: 7000
		})
		.catch(async err => {
			log(`Could not Login to Like4Like!`, 'ERROR')
			const errorText = await page.evaluate(
				() => document.querySelector('#h3').innerText
			)
			if (errorText) {
				log(`Login error message: ${errorText}`)
			}
			let statusDuration = null
			let accountStatus = null
			page
				.waitForSelector('#g-recaptcha_text', {
					timeout: 4000
				})
				.then(async () => {
					accountStatus = 'CAPTCHA_SHOWUP'
					statusDuration = 61
				})
				.catch(async err => {})
			if (errorText.indexOf('deactivated') !== -1) {
				accountStatus = 'DEACTIVATED'
			} else if (errorText.indexOf('blocked') !== -1) {
				accountStatus = 'BLOCKED'
				statusDuration = 60 * 25
			} else if (errorText.indexOf('suspended') !== -1) {
				accountStatus = 'SUSPENDED'
				statusDuration = 60 * 25
			}
			if (accountStatus) {
				await changeAccountStatus(account.id, accountStatus, statusDuration)
			}
			if (!accountSpecifyed) {
				account = await getNewAccount()
				await login(page, account)
			} else {
				throw new Error(`Couldn't login to account #${account.id}`)
			}
			return true
		})
	if (page.url() === 'https://www.like4like.org/') {
		log('Successfully logged in to Like4Like')
	}
}

module.exports = login
