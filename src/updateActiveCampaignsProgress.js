const updateCampaignProgress = require('./updateCampaignProgress')
const getUserCampaigns = require('./apiQueries/getUserCampaigns')
const log = require('./apiQueries/log')
const updateActiveCampaignsProgress = async function() {
	try {
		const campaigns = await getUserCampaigns({
			status: { _in: ['ACTIVE', 'PARTIALLY_ACTIVE'] },
			like_campaigns: { status: { _eq: 'ACTIVE' } }
		})
		if (campaigns && campaigns.length) {
			asyncForEach(campaigns, async campaign => {
				await updateCampaignProgress(campaign)
			})
			return `Checking progress for ${ campaigns }`
		} else {
			return 'No Active campaigns found'
		}
	} catch (err) {
		log(
			`Error happened in updateActiveCampaignsProgress! ${err.message}`,
			'ERROR'
		)
		return err
	}
}

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array)
	}
}

module.exports = updateActiveCampaignsProgress
