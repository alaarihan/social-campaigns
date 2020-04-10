import { deleteLogsGql } from '../gqlQueries'
import { gqlClient } from '../utils'
const log = require('./log')

const deleteLogs = async function(where) {
	let variables = {
		where
	}

	return await gqlClient
		.request(deleteLogsGql, variables)
		.then(function(data) {
			log(`${data.delete_log.affected_rows} logs has been deleted`)
			return data.delete_log.affected_rows
		})
		.catch(function(error) {
			log("Couldn't delete logs", 'ERROR')
		})
}

module.exports = deleteLogs
