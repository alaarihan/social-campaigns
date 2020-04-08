import { getCurrentAccount } from '../setAccount'
import { updateAccountCredit, log } from '../apiQueries'
const checkIfBonustoClickPuzzle = require('./checkIfBonustoClickPuzzle')

async function updateCredit(page, account) {
	if (!account) {
		account = await getCurrentAccount()
	}
	if (!page) return false
	await checkIfBonustoClickPuzzle(page)
	const currentCredit = await page
		.evaluate(() => document.querySelector('#earned-credits').innerText)
		.catch(() => {
			log("Couldn't get current credit", 'ERROR')
		})
	if (currentCredit) {
		updateAccountCredit(account.id, parseInt(currentCredit))
	}
}

module.exports = updateCredit
