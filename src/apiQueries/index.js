const getAccount = require('./getAccount')
const getAccounts = require('./getAccounts')
const changeAccountStatus = require('./changeAccountStatus')
const updateInactiveAccountsState = require('./updateInactiveAccountsState')
const updateLastActivity = require('./updateLastActivity')
const updateAccountCredit = require('./updateAccountCredit')
const deleteLogs = require('./deleteLogs')
const getSetting = require('./getSetting')
const log = require('./log')

module.exports = {
	getAccount,
	getAccounts,
	updateInactiveAccountsState,
	changeAccountStatus,
	updateLastActivity,
	updateAccountCredit,
	deleteLogs,
	getSetting,
	log
}
