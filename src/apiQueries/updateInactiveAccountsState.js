import { getAccounts } from '../gqlQueries'
import { gqlClient } from '../utils'
const changeAccountStatus = require('./changeAccountStatus')
const log = require('./log')

const updateInactiveAccountsState = async function() {
	// Set online accounts to offline status after 4 inactive minutes
	let lastActivity = new Date()
	lastActivity.setMinutes(lastActivity.getMinutes() - 4)
	let variables = {
		order_by: { last_activity: 'asc' },
		where: { status: { _eq: 'ONLINE' }, last_activity: { _lt: lastActivity } }
	}
	await gqlClient
		.request(getAccounts, variables)
		.then(function(data) {
			for (var i = 0, len = data.account.length; i < len; i++) {
				changeAccountStatus(data.account[i].id, 'OFFLINE', null)
			}
		})
		.catch(function(error) {
			log(
				`Couldn't get onilne accounts to check last activity ${error.message}`,
				'ERROR'
			)
		})

	// Set odd account statuses to offline status after pass the specified duration
	variables = await {
		order_by: { last_activity: 'asc' },
		where: {
			status: { _nin: ['OFFLINE', 'ONLINE'] },
			status_duration: { _is_null: false }
		}
	}
	await gqlClient
		.request(getAccounts, variables)
		.then(function(data) {
			for (var i = 0, len = data.account.length; i < len; i++) {
				let statusTime = new Date()
				statusTime.setMinutes(
					statusTime.getMinutes() - data.account[i].status_duration
				)
				let accountLastActivity = new Date(data.account[i].last_activity)
				if (accountLastActivity < statusTime) {
					changeAccountStatus(data.account[i].id, 'OFFLINE', null)
				}
			}
		})
		.catch(function(error) {
			log(
				`Couldn't get disabled accounts to check last activity ${error.message}`,
				'ERROR'
			)
		})
}

module.exports = updateInactiveAccountsState
