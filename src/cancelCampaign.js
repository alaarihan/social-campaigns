const puppeteer = require('puppeteer')
const getAccounts = require('./apiQueries/getAccounts')
const log = require('./apiQueries/log')
const updateUserCampaign = require('./apiQueries/updateUserCampaign')
const updateLikeCampaign = require('./apiQueries/updateLikeCampaign')
const getLikeCampaigns = require('./apiQueries/getLikeCampaigns')
const {
	login,
	removeCampaignLink,
	checkIfBonustoClickPuzzle
} = require('./actions')
import { getCampaignPageTitle, getStandardYoutubeUrl } from './actions/helpers'

var runMode = process.env.HEADLESS === 'no' ? false : true
var browser = null
const cancelCampaign = async function(campaign) {
	try {
		const likeCampaigns = await getLikeCampaigns({
			status: { _eq: 'ACTIVE' },
			user_compaign_id: { _eq: campaign.id }
		})
		if (likeCampaigns.length < 1) return false
		let loginBlockedUsersIds = []
		for (let index = 0; index < likeCampaigns.length; index++) {
			const likeCampaignAccount = likeCampaigns[index].account
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
			try {
				await login(page, likeCampaignAccount, false)
			} catch (err) {
				loginBlockedUsersIds.push(likeCampaignAccount.id)
				await browser.close()
				continue
			}

			try {
				log('Going to manage pages')
				await page.goto('https://www.like4like.org/user/manage-pages.php')
				await page.waitFor(2000)
				await checkIfBonustoClickPuzzle(
					page,
					'https://www.like4like.org/user/manage-pages.php'
				)

				// Remove everything after the video ID ( because like4 site does that)
				let campaignLink =
					campaign.link.indexOf('&') !== -1
						? campaign.link.substring(0, campaign.link.indexOf('&'))
						: campaign.link
				if (campaign.type.startsWith('YOUTUBE')) {
					campaignLink = getStandardYoutubeUrl(campaign.link)
				}
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
				let likeCampaignStatus = 'CANCELED'
				if (likeCampaigns[index].status === 'COMPLETED') {
					likeCampaignStatus = 'REMOVED'
				} else if (loginBlockedUsersIds.includes(likeCampaignAccount.id)) {
					likeCampaignStatus = 'TO_BE_REMOVED'
				}
				await updateLikeCampaign(likeCampaigns[index].id, {
					status: likeCampaignStatus
				})
			} catch (err) {
				log(`Couldn't remove like camapign ${err.message}`)
				await browser.close()
			}
		}

		let userCampaignStatus = 'CANCELED'
		let userCampaignRepeated = campaign.repeated
		let userCampaignProgress = campaign.progress
		if (
			campaign.status === 'COMPLETED' &&
			(campaign.repeat === -1 ||
				(campaign.repeat > 0 && campaign.repeat > campaign.repeated))
		) {
			userCampaignStatus = 'PENDING'
			userCampaignRepeated = campaign.repeated + 1
			userCampaignProgress = 0
		}
		const updatedUserCampaign = await updateUserCampaign(campaign.id, {
			status: userCampaignStatus,
			repeated: userCampaignRepeated,
			progress: userCampaignProgress
		})
		log('Done!')
		return updatedUserCampaign.like_campaigns
	} catch (err) {
		if (browser) {
			await browser.close()
		}
		log(`Error happened in cancelCampaign! ${err.message}`, 'ERROR')
		return err
	}
}

module.exports = cancelCampaign
