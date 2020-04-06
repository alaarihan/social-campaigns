const { getCampaigns } = require('../gqlQueries')
const { gqlClient } = require('../utils')
const log = require('./log')
const getUserCampaigns = async function(where = null) {
	let variables = {
		where
	}
	return await gqlClient
		.request(getCampaigns, variables)
		.then(function(data) {
			console.log(data)
			return data.campaign
		})
		.catch(function(error) {
			log("Couldn't get user campaigns " + error.message, 'ERROR')
		})
}

module.exports = getUserCampaigns
