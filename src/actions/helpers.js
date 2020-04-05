function getCampaignPageTitle(type){
	let campaignPageTitle = ''
	switch(type) {
	  case 'YOUTUBE_VIEWS':
		campaignPageTitle = 'Manage YouTube Videos Pages'
		break;
	  case 'YOUTUBE_LIKES':
		campaignPageTitle = 'Manage YouTube Likes Pages'
		break;
	  case 'YOUTUBE_SUBSCRIBES':
		campaignPageTitle = 'Manage YouTube Subscribes Pages'
		break;
	  case 'YOUTUBE_COMMENTS':
		campaignPageTitle = 'Manage YouTube Comments Pages'
		break;
	  }
	  return campaignPageTitle
  }

module.exports = {
    getCampaignPageTitle
}
