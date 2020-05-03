const { getLikeCampaignsQuery } = require('../gqlQueries')
const { gqlClient } = require('../utils')
const log = require('./log')
const getLikeCampaigns = async function(where = null) {
	let variables = {
		where
	}
	return await gqlClient
		.request(getLikeCampaignsQuery, variables)
		.then(function(data) {
			console.log(data)
			return data.like_campaign
		})
		.catch(function(error) {
			log("Couldn't get like campaigns " + error.message, 'ERROR')
		})
}

module.exports = getLikeCampaigns
