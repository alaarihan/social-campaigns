function getCampaignPageTitle(type) {
	let campaignPageTitle = ''
	switch (type) {
		case 'YOUTUBE_VIEWS':
			campaignPageTitle = 'Manage YouTube Videos Pages'
			break
		case 'YOUTUBE_LIKES':
			campaignPageTitle = 'Manage YouTube Likes Pages'
			break
		case 'YOUTUBE_SUBSCRIBES':
			campaignPageTitle = 'Manage YouTube Subscribes Pages'
			break
		case 'YOUTUBE_COMMENTS':
			campaignPageTitle = 'Manage YouTube Comments Pages'
			break
		case 'FACEBOOK_LIKES':
			campaignPageTitle = 'Manage Facebook Likes Pages'
			break
		case 'FACEBOOK_VIEWS':
			campaignPageTitle = 'Manage Facebook Video Pages'
			break
		case 'FACEBOOK_FOLLOWS':
			campaignPageTitle = 'Manage Facebook Follows Pages'
			break
		case 'FACEBOOK_SHARES':
			campaignPageTitle = 'Manage Facebook Shares Pages'
			break
		case 'FACEBOOK_COMMENTS':
			campaignPageTitle = 'Manage Facebook Comments Pages'
			break
	}
	return campaignPageTitle
}

module.exports = {
	getCampaignPageTitle
}
