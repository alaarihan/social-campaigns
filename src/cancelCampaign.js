const puppeteer = require('puppeteer')
const getAccounts = require('./apiQueries/getAccounts')
const log = require('./apiQueries/log')
const updateUserCampaign = require('./apiQueries/updateUserCampaign')
const updateLikeCampaign = require('./apiQueries/updateLikeCampaign')
const { login, clickPuzzleMap, removeCampaignLink } = require('./actions')
import { getCampaignPageTitle } from './actions/helpers'

var runMode = process.env.HEADLESS === 'no' ? false : true
var browser = null
const cancelCampaign = async function(campaign) {
	try {
		const accounts = await getAccounts({
			like_campaigns: { user_campaign: { id: { _eq: campaign.id } } }
		})
		if (accounts.length < 1) return false
		for (let index = 0; index < accounts.length; index++) {
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
			await login(page, accounts[index], false)

			log('Going to manage pages')
			await page.goto('https://www.like4like.org/user/manage-pages.php')
			await page.waitFor(2000)
			if (page.url() === 'https://www.like4like.org/user/bonus-page.php') {
				await clickPuzzleMap(page, 'Bonus page')
				await page.goto('https://www.like4like.org/user/manage-pages.php')
			}

			// Remove everything after the video ID ( because like4 site does that)
			const campaignLink =
				campaign.link.indexOf('&') !== -1
					? campaign.link.substring(0, campaign.link.indexOf('&'))
					: campaign.link

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
			await page.waitForSelector('#add-facebook', { timeout: 7000 })
			await removeCampaignLink(page, campaignLink)
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
	} catch (err) {
		if (browser) {
			await browser.close()
		}
		log(`Error happened in cancelCampaign! ${err.message}`, 'ERROR')
		return err.message
	}
}

module.exports = cancelCampaign
