const os = require('os')
import { gqlClient } from '../utils'
import { createLog } from '../gqlQueries'
import { getCurrentAccount } from '../setAccount'

const hostName = os.hostname()

const log = async function(message, type) {
	const account = await getCurrentAccount()
	if (!type) {
		type = 'INFO'
	}
	console.log(message)
	let variables = {}

	if (!account || !account.id) {
		variables = {
			message,
			type,
			hostName
		}
	} else {
		variables = {
			message,
			type,
			hostName,
			account_id: account.id
		}
	}

	gqlClient
		.request(createLog, variables)
		.then(function(data) {})
		.catch(function(error) {
			console.log("Couldn't create Log " + error.message)
		})
}

module.exports = log
