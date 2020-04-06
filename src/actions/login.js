const { getNewAccount } = require('../setAccount')

const {
	updateLastActivity,
	changeAccountStatus,
	log
} = require('../apiQueries')
async function login(page, account) {
	let accountSpecifyed = account ? true : false
	if (!account) {
		account = await getNewAccount()
	}
	if (!account) {
		await log('No offline accounts available')
		return false
	}
	await changeAccountStatus(account.id, 'ONLINE')
	updateLastActivity(account.id)
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
			log(`Could not Login to Like4Like! ${err.message}`, 'ERROR')
			const errorText = await page.evaluate(
				() => document.querySelector('#h3').innerText
			)
			let statusDuration = null
			let accountStatus = null
			if (errorText.indexOf('deactivated') !== -1) {
				accountStatus = 'DEACTIVATED'
			} else if (errorText.indexOf('blocked') !== -1) {
				accountStatus = 'BLOCKED'
				statusDuration = 60 * 24
			}
			if (accountStatus) {
				await changeAccountStatus(account.id, accountStatus, statusDuration)
			}
			if (!accountSpecifyed) {
				account = await getNewAccount()
				login(page, account)
			} else {
				throw new Error(`Couldn't login to account #${account.id}`)
			}
			return true
		})
	if (page.url() === 'https://www.like4like.org/') {
		log('Successfully logged in to Like4Like')
	}
	// await page.screenshot({ path: 'example.png' })
	updateLastActivity(account.id)
}

module.exports = login
