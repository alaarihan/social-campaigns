import { updateAccount } from '../gqlQueries'
import { gqlClient } from '../utils'
const log = require('./log')

const changeAccountStatus = async function(id, status, duration) {
	let variables = {
		_set: { status },
		where: { id: { _eq: id } }
	}

	if(duration !== undefined){
		variables._set.status_duration = duration
	}

	await gqlClient
		.request(updateAccount, variables)
		.then(function(data) {
			log(
				`Account ${data.update_account.returning[0].username} status changed to ${status}`
			)
		})
		.catch(function(error) {
			log("Couldn't change account status " + error.message, 'ERROR')
		})
}

module.exports = changeAccountStatus
