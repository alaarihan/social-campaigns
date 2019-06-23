const puppeteer = require('puppeteer')
const getUserCampaignById = require('./apiQueries/getUserCampaignById')
const log = require('./apiQueries/log')
const updateUserCampaign = require('./apiQueries/updateUserCampaign')
const updateLikeCampaign = require('./apiQueries/updateLikeCampaign')
const { login, clickPuzzleMap, updateCredit } = require('./actions')

var runMode = process.env.HEADLESS === 'no' ? false : true
var browser = null
const updateCampaignProgress = async function(campaign) {
	campaign = await getUserCampaignById(campaign.id)
	if (campaign.likeCampaigns.length < 1) return false
	var campaignProgress = 0
	for (let index = 0; index < campaign.likeCampaigns.length; index++) {
		const likeCampaign = campaign.likeCampaigns[index]
		const account = likeCampaign.account
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
		await login(page, account)
		if (!page) return false
		log('Going to manage pages')
		await page.goto('https://www.like4like.org/user/manage-pages.php')
		await page.waitFor(2000)
		if (page.url() === 'https://www.like4like.org/user/bonus-page.php') {
			await clickPuzzleMap(page)
			await page.goto('https://www.like4like.org/user/manage-pages.php')
		}
		await updateCredit(page, account)
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
		await page.waitForSelector('#add-facebook', { timeout: 12000 })
		const likeCampaignProgress = await page
			.evaluate(campaign => {
				var selectorID = jQuery(
					`tr[id^="links"] span[id^="links-tdlink"]:contains('${campaign.link}')`
				).attr('id')
				selectorID = selectorID
					? selectorID.substring('links-tdlink'.length)
					: ''
				var selector = '#links' + selectorID
				var progress = jQuery(selector + ` #links-tdlikes${selectorID}`).text()
				return progress
			}, campaign)
			.catch(error => {
				log(error.message)
			})
		if (likeCampaignProgress) {
			let variables = {
				progress: parseInt(likeCampaignProgress)
			}
			if (parseInt(likeCampaignProgress) >= parseInt(likeCampaign.limit)) {
				variables.status = 'COMPLETED'
			}
			await updateLikeCampaign(likeCampaign.id, variables)
			campaignProgress += parseInt(likeCampaignProgress)
		}
		await browser.close()
	}
	let variables = {
		progress: parseInt(campaignProgress)
	}
	if (parseInt(campaignProgress) >= parseInt(campaign.target)) {
		variables.status = 'COMPLETED'
	}
	const updatedUserCampaign = await updateUserCampaign(campaign.id, variables)
	log('Done!')
	return updatedUserCampaign
}

module.exports = updateCampaignProgress
