const puppeteer = require('puppeteer')
const getAccounts = require('./apiQueries/getAccounts')
const log = require('./apiQueries/log')
const createLikeCampaign = require('./apiQueries/createLikeCampaign')
const updateUserCampaign = require('./apiQueries/updateUserCampaign')
const updateAccount = require('./apiQueries/updateAccount')
const getUserCampaignById = require('./apiQueries/getUserCampaignById')
const {
	login,
	checkIfBonustoClickPuzzle,
	removeCampaignLink,
	updateCredit
} = require('./actions')
import { getCampaignPageTitle, getStandardYoutubeUrl } from './actions/helpers'

var runMode = process.env.HEADLESS === 'no' ? false : true
var browser = null
const startCampaign = async function(campaign) {
	try {
		const accounts = await getAccounts(null, { credit: 'desc' })
		if (accounts.length < 1) return false
		let activeCampaignAccountsNumber = 0
		if (!campaign.limited) {
			if (!campaign.accounts) {
				campaign = await getUserCampaignById(campaign.id)
			}
			if (campaign.accounts && campaign.accounts.length) {
				activeCampaignAccountsNumber = campaign.accounts.length
			}
			if (activeCampaignAccountsNumber >= parseInt(campaign.accounts_number))
				return false
		}
		var totalCampaingnsTarget = 0
		var createdLikeCampaigns = []
		for (let index = 0; index < accounts.length; index++) {
			if (
				campaign.limited &&
				accounts[index].available_credit < campaign.cost_per_one
			)
				continue
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
			await checkIfBonustoClickPuzzle(
				page,
				'https://www.like4like.org/user/manage-pages.php'
			)
			await updateCredit(page, accounts[index], false)
			let campaignLimit = -1
			let remainingTarget = 0
			if (campaign.limited) {
				remainingTarget = parseInt(campaign.target) - totalCampaingnsTarget
				if (
					remainingTarget * parseInt(campaign.cost_per_one) >=
					parseInt(accounts[index].available_credit)
				) {
					campaignLimit =
						parseInt(accounts[index].available_credit) -
						(parseInt(accounts[index].available_credit) %
							parseInt(campaign.cost_per_one))
				} else {
					campaignLimit = Math.ceil(
						remainingTarget * parseInt(campaign.cost_per_one)
					)
				}
			}

			// Remove everything after the video ID ( because like4 site does that)
			let campaignLink =
				campaign.link.indexOf('&') !== -1
					? campaign.link.substring(0, campaign.link.indexOf('&'))
					: campaign.link
			if (campaign.type.startsWith('YOUTUBE')) {
				campaignLink = getStandardYoutubeUrl(campaign.link)
			}

			const likeCampaign = {
				limit: campaignLimit,
				link: campaignLink,
				costPerOne: campaign.cost_per_one.toString(),
				type: campaign.type,
				overwrite: campaign.overwrite
			}

			let campaignPageTitle = getCampaignPageTitle(campaign.type)
			await page
				.waitForSelector(`a[title="${campaignPageTitle}"]`, {
					timeout: 7000
				})
				.catch(async error => {
					log(
						`Something wrong happened, I couldn't find "${campaignPageTitle}" link ${error.message}`
					)
				})
			await page.click(`a[title="${campaignPageTitle}"]`)
			await page.waitForSelector('#add-facebook', { timeout: 7000 })
			await page.type('#add-facebook', likeCampaign.link)
			await page.type('#add-facebook-description', campaign.id.toString())
			await page.select(
				'#add-facebook-credits',
				campaign.cost_per_one.toString()
			)
			await page.click('input[name="add-facebook-button"]')
			await page.waitFor(2000)
			const errorText = await page.evaluate(
				() => document.querySelector('#add-facebook-comment').innerText
			)
			log(errorText)
			if (errorText === 'Link is already enter') {
				if (likeCampaign.overwrite === 'yes') {
					await removeCampaignLink(page, likeCampaign.link)
					await page.click('input[name="add-facebook-button"]')
					await page.waitFor(5000)
				} else {
					continue
				}
			}
			const createdLikeCampaign = await createLikeCampaign({
				name: `#${index + 1} for user campaign #${campaign.id} in account ${
					accounts[index].username
				}`,
				limit: campaign.limited
					? Math.ceil(parseInt(campaignLimit) / parseInt(campaign.cost_per_one))
					: -1,
				user_compaign_id: campaign.id,
				account_id: accounts[index].id,
				status: 'ACTIVE',
				type: campaign.type,
				cost_per_one: campaign.cost_per_one
			})
			createdLikeCampaigns.push(createdLikeCampaign)
			if (!campaign.limited) {
				await updateAccount(accounts[index].id, { campaign_id: campaign.id })
			}
			// limit like campaign start
			if (campaign.limited) {
				const linkId = await page
					.evaluate(likeCampaign => {
						var selectorID = jQuery(
							`tr[id^="links"] span[id^="links-tdlink"]:contains('${likeCampaign.link}')`
						).attr('id')
						return selectorID ? selectorID.substring('links-tdlink'.length) : ''
					}, likeCampaign)
					.catch(error => {
						log(error.message)
					})
				log('Check Set limit for total credits checkbox')
				await page
					.evaluate(linkId => {
						var selector = '#links' + linkId
						jQuery(selector + ' a[id^="credit_limit_"]').trigger('click')
						var limitChecked = jQuery(
							'#credit-limit-list-' + linkId + ' input[name="limit"]'
						).is(':checked')
						if (!limitChecked) {
							jQuery(
								'#credit-limit-list-' + linkId + ' input[name="limit"]'
							).trigger('click')
						} else {
							totallimitchange(linkId)
						}
					}, linkId)
					.catch(error => {
						log(error.message)
					})
				await page.waitFor(3000)
				log('Type limit number and save')
				await page.type(
					'input[name="Total Credits"]',
					likeCampaign.limit.toString()
				)
				await page.click(`#credit-limit-list-${linkId} a[title="Save Changes"]`)
				await page.waitFor(3000)
				log('Activate campaign')
				await page
					.evaluate(
						likeCampaign => {
							var selector = jQuery(
								`tr[id^="links"]:contains('${likeCampaign.link}')`
							)
								.parent()
								.parent()
							selector
								.find('select[name^="add-facebook-credits-id"')
								.val(likeCampaign.costPerOne)
							selector.find('a[onclick^="updatelink"').trigger('click')
						},

						likeCampaign
					)
					.catch(error => {
						log(error.message)
					})
				totalCampaingnsTarget +=
					parseInt(campaignLimit) / parseInt(campaign.cost_per_one)
			} //limit campaign end
			if (
				(campaign.limited &&
					totalCampaingnsTarget >= parseInt(campaign.target)) ||
				(!campaign.limited &&
					createdLikeCampaigns.length + activeCampaignAccountsNumber >=
						parseInt(campaign.accounts_number))
			) {
				updateUserCampaign(campaign.id, { status: 'ACTIVE' })
				await browser.close()
				break
			} else {
				await browser.close()
			}
		}
		if (
			(campaign.limited &&
				totalCampaingnsTarget < parseInt(campaign.target) &&
				createdLikeCampaigns.length > 0) ||
			(!campaign.limited &&
				createdLikeCampaigns.length + activeCampaignAccountsNumber <
					parseInt(campaign.accounts_number) &&
				createdLikeCampaigns.length > 0)
		) {
			updateUserCampaign(campaign.id, { status: 'PARTIALLY_ACTIVE' })
			await browser.close()
		}
		log('Done!')
		return createdLikeCampaigns
	} catch (err) {
		if (browser) {
			await browser.close()
		}
		updateUserCampaign(campaign.id, { status: 'RESTART' })
		log(`Error happened in startCampaign! ${err.message}`, 'ERROR')
		return err
	}
}

module.exports = startCampaign
