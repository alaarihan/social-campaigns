const getAccount = require('./getAccount')
const getAccounts = require('./getAccounts')
const changeAccountStatus = require('./changeAccountStatus')
const updateInactiveAccountsState = require('./updateInactiveAccountsState')
const updateLastActivity = require('./updateLastActivity')
const updateAccount = require('./updateAccount')
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
	updateAccount,
	updateAccountCredit,
	deleteLogs,
	getSetting,
	log
}
