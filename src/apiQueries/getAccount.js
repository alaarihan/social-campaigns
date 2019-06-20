const { getAccounts } = require('../gqlQueries')
const { gqlClient } = require('../utils')
const log = require('./log')
// Get an offline account
const getAccount = async function() {
	let variables = {
		order_by: { lastActivity: 'asc' },
		where: { status: { _eq: 'OFFLINE' } }
	}
	return await gqlClient
		.request(getAccounts, variables)
		.then(function(data) {
			console.log(data)
			if (data.account.length < 1) {
				return false
			}
			return data.account[0]
		})
		.catch(function(error) {
			log("Couldn't get accounts " + error.message, 'ERROR')
		})
}

module.exports = getAccount
