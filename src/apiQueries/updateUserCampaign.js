import { updateCampaign } from '../gqlQueries'
import { gqlClient } from '../utils'
const log = require('./log')

const updateUserCampaign = async function(id, data) {
	let variables = {
		_set: data,
		where: { id: { _eq: id } }
	}

	await gqlClient
		.request(updateCampaign, variables)
		.then(function(data) {
			log(`Update user campaign ${data.update_campaign.returning[0].id}`)
		})
		.catch(function(error) {
			log("Couldn't update user campaign ", 'ERROR')
		})
}

module.exports = updateUserCampaign
