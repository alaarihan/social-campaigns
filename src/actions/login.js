const { getNewAccount } = require('../setAccount')

const {
	updateLastActivity,
	changeAccountStatus,
	log
} = require('../apiQueries')
async function login(page, account) {
	if (!account) {
		account = await getNewAccount()
	}
	if (!account) {
		return await log('No offline accounts available')
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
	await page.waitForSelector('a[href="https://www.like4like.org/user/"]', {
		timeout: 7000
	}).catch(async err => {
		log('Could not Login to Like4Like!', 'ERROR')
		const errorText = await page.evaluate(
			() => document.querySelector('#h3').innerText
		)
		let accountStatus = 'OFFLINE'
		if (errorText.indexOf('deactivated') !== -1) {
			accountStatus = 'DEACTIVATED'
		}else if(errorText.indexOf('blocked') !== -1) {
			accountStatus = 'BLOCKED'
		}
		await changeAccountStatus(account.id, accountStatus)
		account = await getNewAccount()
		login(page, account)
		return false
	})
	if (page.url() === 'https://www.like4like.org/') {
		log('Successfully logged in to Like4Like')
	}
	// await page.screenshot({ path: 'example.png' })
	updateLastActivity(account.id)
}

module.exports = login
