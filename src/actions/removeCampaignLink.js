const log = require('../apiQueries/log')

const removeCampaignLink = async function(page, link) {
	log('Remove existing link from the account')
	await page
		.evaluate(link => {
			var selectorID = jQuery(
				`tr[id^="links"] span[id^="links-tdlink"]:contains('${link}')`
			).attr('id')
			selectorID = selectorID ? selectorID.substring('links-tdlink'.length) : ''
			var selector = '#links' + selectorID
			jQuery(selector + ` a[onclick^="archivelink(${selectorID}"]`).trigger(
				'click'
			)
		}, link)
		.catch(error => {
			log(error.message)
		})
	await page.waitFor(5000)
	await page
		.evaluate(link => {
			var selectorID = jQuery(
				`span[id^='linksarchive-tdlink']:contains('${link}')`
			).attr('id')
			if (selectorID) {
				selectorID = selectorID.substring('linksarchive-tdlink'.length)
				var selector = '#linksarchive' + selectorID
				jQuery(selector + ' a[onclick^="deletelink"]').trigger('click')
			}
		}, link)
		.catch(error => {
			log(error.message)
		})
	await page.waitFor(5000)
}

module.exports = removeCampaignLink
