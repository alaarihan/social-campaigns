const getLogsGql = require('../gqlQueries').getLogs
const { gqlClient } = require('../utils')

const getLogs = async function(where, order_by, limit = 10, offset = 0) {
	if (!where) {
		where = { status: { _in: ['OFFLINE', 'ONLINE'] } }
	}
	if (!order_by) {
		order_by = { id: 'desc' }
	}
	let variables = {
		order_by,
		where,
		limit,
		offset
	}
	return await gqlClient
		.request(getLogsGql, variables)
		.then(function(data) {
			console.log(data)
			if (data.log.length < 1) {
				return false
			}
			return data.log
		})
		.catch(function(error) {
			console.log("Couldn't get logs " + error.message, 'ERROR')
		})
}

module.exports = getLogs
