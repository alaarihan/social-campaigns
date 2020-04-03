const { gqlClient } = require('../utils')
const createLikeCampaignGql = require('../gqlQueries').createLikeCampaign
const log = require('./log')
const createLikeCampaign = async function(variables) {
	return gqlClient
		.request(createLikeCampaignGql, { objects: variables })
		.then(function(data) {
			log('The like campaign has been created')
			return data.insert_like_campaign.returning[0]
		})
		.catch(function(error) {
			log("Couldn't create like campaign " + error.message, 'ERROR')
		})
}

module.exports = createLikeCampaign
