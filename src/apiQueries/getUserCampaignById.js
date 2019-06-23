const { getCampaigns } = require('../gqlQueries')
const { gqlClient } = require('../utils')
const log = require('./log')
const getUserCampaignById = async function(id) {
	let variables = {
		where: { id: { _eq: id } }
	}
	return await gqlClient
		.request(getCampaigns, variables)
		.then(function(data) {
			console.log(data)
			if (data.campaign.length < 1) {
				return false
			}
			return data.campaign[0]
		})
		.catch(function(error) {
			log("Couldn't get user campaign " + error.message, 'ERROR')
		})
}

module.exports = getUserCampaignById
