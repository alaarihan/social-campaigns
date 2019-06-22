const updateLikeCampaignGql = require('../gqlQueries').updateLikeCampaign
import { gqlClient } from '../utils'
const log = require('./log')

const updateLikeCampaign = async function(id, data) {
	let variables = {
		_set: data,
		where: { id: { _eq: id } }
	}

	await gqlClient
		.request(updateLikeCampaignGql, variables)
		.then(function(data) {
			log(`Update like campaign ${data.update_likeCampaign.returning[0].id}`)
		})
		.catch(function(error) {
			log("Couldn't update like campaign " + error, 'ERROR')
		})
}

module.exports = updateLikeCampaign
