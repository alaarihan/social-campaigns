import { updateAccount } from '../gqlQueries'
import { gqlClient } from '../utils'
const log = require('./log')

const updateAccountCredit = async function(id, credit) {
	let now = new Date()
	let variables = {
		_set: { credit },
		where: { id: { _eq: id } }
	}

	await gqlClient
		.request(updateAccount, variables)
		.then(function(data) {
			log(
				`Update Account ${data.update_account.returning[0].username} credit to ${credit}`
			)
		})
		.catch(function(error) {
			log("Couldn't update account credit ", 'ERROR')
		})
}

module.exports = updateAccountCredit
