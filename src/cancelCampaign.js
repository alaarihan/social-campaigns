const puppeteer = require('puppeteer')
const getAccounts = require('./apiQueries/getAccounts')
const log = require('./apiQueries/log')
const updateUserCampaign = require('./apiQueries/updateUserCampaign')
const updateLikeCampaign = require('./apiQueries/updateLikeCampaign')
const { login, clickPuzzleMap } = require('./actions')

var runMode = process.env.HEADLESS === 'no' ? false : true
var browser = null
const startCampaign = async function(campaign) {
	const accounts = await getAccounts({
		like_campaigns: { user_campaign: { id: { _eq: campaign.id } } }
	})
	if (accounts.length < 1) return false
	var totalCampaingnsTarget = 0
	for (let index = 0; index < accounts.length; index++) {
		browser = await puppeteer.launch({
			headless: runMode,
			defaultViewport: null,
			args: ['--no-sandbox']
		})
		let page = await browser.pages()
		page = page[0]
		if (!page) {
			await browser.close()
			return false
		}
		await login(page, accounts[index])
		if (!page) return false
		log('Going to manage pages')
		await page.goto('https://www.like4like.org/user/manage-pages.php')
		await page.waitFor(2000)
		if (page.url() === 'https://www.like4like.org/user/bonus-page.php') {
			await clickPuzzleMap(page)
			await page.goto('https://www.like4like.org/user/manage-pages.php')
		}
		// await updateCredit(page)
		let campagnLimit = 0
		let remainingTarget = parseInt(campaign.target) - totalCampaingnsTarget
		if (remainingTarget * 11 >= parseInt(accounts[index].credit)) {
			campagnLimit = parseInt(accounts[index].credit)
		} else {
			campagnLimit = remainingTarget * 11
		}
		const likeCampaign = {
			limit: campagnLimit,
			link: campaign.link
		}
		await page
			.waitForSelector('a[title="Manage YouTube Videos Pages"]', {
				timeout: 7000
			})
			.catch(async error => {
				log(
					'Something wrong happened, I couldn\'t find "Manage YouTube Videos Pages" link'
				)
			})
		await page.click('a[title="Manage YouTube Videos Pages"]')
		await page.waitForSelector('#add-facebook', { timeout: 7000 })
		await page
			.evaluate(likeCampaign => {
				var selectorID = jQuery(
					`tr[id^="links"] span[id^="links-tdlink"]:contains('${likeCampaign.link}')`
				).attr('id')
				selectorID = selectorID
					? selectorID.substring('links-tdlink'.length)
					: ''
				var selector = '#links' + selectorID
				jQuery(selector + ` a[onclick^="archivelink(${selectorID}"]`).trigger(
					'click'
				)
			}, likeCampaign)
			.catch(error => {
				log(error.message)
			})
		await page.waitFor(2000)
		await page
			.evaluate(likeCampaign => {
				var selectorID = jQuery(
					`span[id^='linksarchive-tdlink']:contains('${likeCampaign.link}')`
				).attr('id')
				if (selectorID) {
					selectorID = selectorID.substring('linksarchive-tdlink'.length)
					var selector = '#linksarchive' + selectorID
					jQuery(selector + ' a[onclick^="deletelink"]').trigger('click')
				}
			}, likeCampaign)
			.catch(error => {
				log(error.message)
			})
		await page.waitFor(2000)
		await browser.close()
	}
	const updatedUserCampaign = await updateUserCampaign(campaign.id, {
		status: 'CANCELED'
	})
	const updatedUserCampaignLikeCampaigns = updatedUserCampaign.like_campaigns
	for (
		let index = 0;
		index < updatedUserCampaignLikeCampaigns.length;
		index++
	) {
		await updateLikeCampaign(updatedUserCampaignLikeCampaigns[index].id, {
			status: 'CANCELED'
		})
	}
	log('Done!')
	return updatedUserCampaignLikeCampaigns
}

module.exports = startCampaign
