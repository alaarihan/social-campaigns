import { getNewAccount } from '../setAccount'
import {
	updateLastActivity,
	updateInactiveAccountsState,
	changeAccountStatus,
	log
} from '../apiQueries'
async function login(browser) {
	await updateInactiveAccountsState()
	const account = await getNewAccount()
	if (!account) {
		return await log('No offline accounts available')
	}
	await changeAccountStatus(account.id, 'ONLINE')
	log(`Logging in to ${account.username} account`)
	let page = await browser.pages()
	page = page[0]
	await page.goto('https://www.like4like.org/login/')
	await page.waitForSelector('#username')
	await page.type('#username', account.username)
	await page.keyboard.down('Tab')
	await page.keyboard.type(account.password)
	await page.click('a[onclick="LoginFunctions();"]')
	await page.waitForSelector('a[href="https://www.like4like.org/user/"]', { timeout: 7000 })
	if (page.url() === 'https://www.like4like.org/') {
		log('Successfully logged in to Like4Like')
	} else {
		log('Could not Login to Like4Like!', 'ERROR')
		const errorText = await page.evaluate(
			() => document.querySelector('#h3').innerText
		)
		let accountStatus = 'BLOCKED'
		if(errorText.indexOf('deactivated') !== -1){
			accountStatus = 'DEACTIVATED'
		}
		await changeAccountStatus(account.id, accountStatus)
		return false
	}
	// await page.screenshot({ path: 'example.png' })
	updateLastActivity(account.id)
	return page
}

module.exports = login
