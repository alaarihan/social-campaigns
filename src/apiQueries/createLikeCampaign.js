const { gqlClient } = require('../utils')
const createLikeCampaignGql = require('../gqlQueries').createLikeCampaign
const log = require('./log')
const createLikeCampaign = async function(variables) {
	return gqlClient
		.request(createLikeCampaignGql, { objects: variables })
		.then(function(data) {
			log('The like campaign has been created')
			return data.insert_likeCampaign.returning[0]
		})
		.catch(function(error) {
			log("Couldn't create like Campaign " + error.message, 'ERROR')
		})
}

module.exports = createLikeCampaign
