const { getSettings } = require('../gqlQueries')
const { gqlClient } = require('../utils')
const log = require('./log')
const getSetting = async function(name) {
	let variables = {
		where: { name: { _eq: name } }
	}
	return await gqlClient
		.request(getSettings, variables)
		.then(function(data) {
			if (data.setting.length < 1) {
				return false
			}
			return data.setting[0].value
		})
		.catch(function(error) {
			log("Couldn't get setting " + error.message, 'ERROR')
		})
}

module.exports = getSetting
