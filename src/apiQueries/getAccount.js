import { getAccounts } from '../gqlQueries'
import { gqlClient } from '../utils'

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
			// log("Couldn't get accounts ", error, 'ERROR')
		})
}

module.exports = getAccount
