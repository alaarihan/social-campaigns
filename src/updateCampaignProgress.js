const puppeteer = require('puppeteer')
const getUserCampaignById = require('./apiQueries/getUserCampaignById')
const log = require('./apiQueries/log')
const updateUserCampaign = require('./apiQueries/updateUserCampaign')
const updateLikeCampaign = require('./apiQueries/updateLikeCampaign')
const { login, clickPuzzleMap, updateCredit } = require('./actions')
import { getCampaignPageTitle } from './actions/helpers'

var runMode = process.env.HEADLESS === 'no' ? false : true
var browser = null
const updateCampaignProgress = async function(campaign) {
	campaign = await getUserCampaignById(campaign.id)
	if (campaign.like_campaigns.length < 1) return false
	var campaignProgress = 0
	for (let index = 0; index < campaign.like_campaigns.length; index++) {
		const likeCampaign = campaign.like_campaigns[index]
		const account = likeCampaign.account
		browser = await puppeteer.launch({
			headless: runMode,
			defaultViewport: null,
			args: ['--no-sandbox', '--disable-features=site-per-process']
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
			await clickPuzzleMap(page, 'Bonus page')
			await page.goto('https://www.like4like.org/user/manage-pages.php')
		}
		await updateCredit(page, account)
		
		let campaignPageTitle = getCampaignPageTitle(campaign.type)
		await page
			.waitForSelector(`a[title="${campaignPageTitle}"]`, {
				timeout: 7000
			})
			.catch(async error => {
				log(
					`Something wrong happened, I couldn\'t find "${campaignPageTitle}" link`
				)
			})
		await page.click(`a[title="${campaignPageTitle}"]`)
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
