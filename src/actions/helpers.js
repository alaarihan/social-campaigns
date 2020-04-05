function getCampaignPageTitle(type){
	let campaignPageTitle = ''
	switch(type) {
	  case 'YoutubeViews':
		campaignPageTitle = 'Manage YouTube Videos Pages'
		break;
	  case 'YoutubeLikes':
		campaignPageTitle = 'Manage YouTube Likes Pages'
		break;
	  case 'YoutubeSubscribes':
		campaignPageTitle = 'Manage YouTube Subscribes Pages'
		break;
	  case 'YoutubeComments':
		campaignPageTitle = 'Manage YouTube Comments Pages'
		break;
	  }
	  return campaignPageTitle
  }

module.exports = {
    getCampaignPageTitle
}
