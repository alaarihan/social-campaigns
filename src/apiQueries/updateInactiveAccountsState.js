import { getAccounts } from '../gqlQueries'
import { gqlClient } from '../utils'
const changeAccountStatus = require('./changeAccountStatus')
const log = require('./log')

const updateInactiveAccountsState = async function() {
	// Set online accounts to offline status after 4 inactive minutes
	let lastActivity = new Date()
	lastActivity.setMinutes(lastActivity.getMinutes() - 4)
	let variables = {
		order_by: { lastActivity: 'asc' },
		where: { status: { _eq: 'ONLINE' }, lastActivity: { _lt: lastActivity } }
	}
	await gqlClient
		.request(getAccounts, variables)
		.then(function(data) {
			console.log(data)
			for (var i = 0, len = data.account.length; i < len; i++) {
				changeAccountStatus(data.account[i].id, 'OFFLINE')
			}
		})
		.catch(function(error) {
			log(
				"Couldn't get onilne accounts to check last activity "+ error.message,
				'ERROR'
			)
		})

	// Set disabled accounts to offline status after 6 inactive hours
	await lastActivity.setHours(lastActivity.getHours() - 6)
	variables = await {
		order_by: { lastActivity: 'asc' },
		where: { status: { _eq: 'DISABLED' }, lastActivity: { _lt: lastActivity } }
	}
	await gqlClient
		.request(getAccounts, variables)
		.then(function(data) {
			for (var i = 0, len = data.account.length; i < len; i++) {
				changeAccountStatus(data.account[i].id, 'OFFLINE')
			}
		})
		.catch(function(error) {
			log(
				"Couldn't get disabled accounts to check last activity ",
				error,
				'ERROR'
			)
		})
	// Set disabled accounts to offline status after 6 inactive hours
	await lastActivity.setHours(lastActivity.getHours() - 18)
	variables = await {
		order_by: { lastActivity: 'asc' },
		where: { status: { _eq: 'BLOCKED' }, lastActivity: { _lt: lastActivity } }
	}
	await gqlClient
		.request(getAccounts, variables)
		.then(function(data) {
			for (var i = 0, len = data.account.length; i < len; i++) {
				changeAccountStatus(data.account[i].id, 'OFFLINE')
			}
		})
		.catch(function(error) {
			log(
				"Couldn't get disabled accounts to check last activity ",
				error,
				'ERROR'
			)
		})
}

module.exports = updateInactiveAccountsState
