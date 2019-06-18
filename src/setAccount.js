const getAccount = require('./apiQueries/getAccount')

var account = null

async function getNewAccount() {
	account = await getAccount()
	return account
}

async function getCurrentAccount() {
	return account
}

async function setAccount(newAccount) {
	account = newAccount
	return account
}

module.exports = {
	getNewAccount,
	setAccount,
	getCurrentAccount
}
