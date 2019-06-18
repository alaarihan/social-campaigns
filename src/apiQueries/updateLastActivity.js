import { updateAccount } from '../gqlQueries'
import { gqlClient } from '../utils'
const log = require('./log')

const updateLastActivity = async function(id) {
	let now = new Date()
	let variables = {
		_set: { lastActivity: now },
		where: { id: { _eq: id } }
	}

	await gqlClient
		.request(updateAccount, variables)
		.then(function(data) {
			log(
				`Account ${data.update_account.returning[0].username} logging last activity ${now}`
			)
		})
		.catch(function(error) {
			log("Couldn't change account status " + error.message, 'ERROR')
		})
}

module.exports = updateLastActivity
