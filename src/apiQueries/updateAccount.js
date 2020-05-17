const updateAccountGql = require('../gqlQueries').updateAccount
import { gqlClient } from '../utils'
const log = require('./log')

const updateAccount = async function(id, data) {
	let variables = {
		_set: data,
		where: { id: { _eq: id } }
	}

	await gqlClient
		.request(updateAccountGql, variables)
		.then(function(data) {
			log(`Account ${data.update_account.returning[0].username} updated`)
		})
		.catch(function(error) {
			log(`Couldn't update account ${error.message}`, 'ERROR')
		})
}

module.exports = updateAccount
