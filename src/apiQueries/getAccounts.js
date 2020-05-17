const getAccountsGql = require('../gqlQueries').getAccounts
const { gqlClient } = require('../utils')
const log = require('../apiQueries/log')

const getAccounts = async function(where, order_by = { last_activity: 'asc' }) {
	if (!where) {
		where = { status: { _in: ['OFFLINE', 'ONLINE', 'DONE', 'YV_SUSPENDED'] } }
	}
	let variables = {
		order_by,
		where
	}
	return await gqlClient
		.request(getAccountsGql, variables)
		.then(function(data) {
			console.log(data)
			if (data.account.length < 1) {
				return false
			}
			return data.account
		})
		.catch(function(error) {
			log("Couldn't get accounts " + error.message, 'ERROR')
		})
}

module.exports = getAccounts
