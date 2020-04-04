const puppeteer = require('puppeteer')
const getAccounts = require('./apiQueries/getAccounts')
const log = require('./apiQueries/log')
const createLikeCampaign = require('./apiQueries/createLikeCampaign')
const updateUserCampaign = require('./apiQueries/updateUserCampaign')
const { login, clickPuzzleMap } = require('./actions')

var runMode = process.env.HEADLESS === 'no' ? false : true
var browser = null
const startCampaign = async function(campaign) {
	const accounts = await getAccounts()
	if (accounts.length < 1) return false
	var totalCampaingnsTarget = 0
	var createdLikeCampaigns = []
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
		await login(page, accounts[index])
		if (!page) return false
		log('Going to manage pages')
		await page.goto('https://www.like4like.org/user/manage-pages.php')
		await page.waitFor(2000)
		if (page.url() === 'https://www.like4like.org/user/bonus-page.php') {
			await clickPuzzleMap(page, 'Bonus page')
			await page.goto('https://www.like4like.org/user/manage-pages.php')
		}
		// await updateCredit(page)
		let campagnLimit = 0
		let remainingTarget = parseInt(campaign.target) - totalCampaingnsTarget
		if (remainingTarget * parseInt(campaign.cost_per_one) >= parseInt(accounts[index].credit)) {
			campagnLimit = parseInt(accounts[index].credit)
		} else {
			campagnLimit = remainingTarget * parseInt(campaign.cost_per_one)
		}
		const likeCampaign = {
			limit: campagnLimit,
			// Remove everything after the video ID ( because like4 site does that)
			link: campaign.link.substring(0, campaign.link.indexOf('&')),
			costPerOne: campaign.cost_per_one.toString()
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
		await page.type('#add-facebook', likeCampaign.link)
		await page.type('#add-facebook-description', campaign.id.toString())
		await page.select('#add-facebook-credits', campaign.cost_per_one.toString())
		await page.click('input[name="add-facebook-button"]')
		await page.waitFor(2000)
		const errorText = await page.evaluate(
			() => document.querySelector('#add-facebook-comment').innerText
		)
		if (errorText === 'Link is already enter') {
			log(errorText)
			await page.click('#archivea')
			await page.waitFor(1000)
			log('Activate the archived link')
			await page
				.evaluate(likeCampaign => {
					var selectorID = jQuery(
						`span[id^='linksarchive-tdlink']:contains('${likeCampaign.link}')`
					).attr('id')
					if (selectorID) {
						selectorID = selectorID.substring('linksarchive-tdlink'.length)
						var selector = '#linksarchive' + selectorID
						jQuery(selector + ' a[onclick^="activatelink"]').trigger('click')
					}
				}, likeCampaign)
				.catch(error => {
					log(error.message)
				})
		}
		await page.waitFor(2000)
		log('Check Set limit for total credits checkbox')
		await page
			.evaluate(likeCampaign => {
				var selectorID = jQuery(
					`tr[id^="links"] span[id^="links-tdlink"]:contains('${likeCampaign.link}')`
				).attr('id')
				selectorID = selectorID
					? selectorID.substring('links-tdlink'.length)
					: ''
				var selector = '#links' + selectorID
				jQuery(selector + ' a[id^="credit_limit_"]').trigger('click')
				var limitChecked = jQuery(
					'#credit-limit-list-' + selectorID + ' input[name="limit"]'
				).is(':checked')
				if (!limitChecked) {
					jQuery(
						'#credit-limit-list-' + selectorID + ' input[name="limit"]'
					).trigger('click')
				} else {
					totallimitchange(selectorID)
				}
			}, likeCampaign)
			.catch(error => {
				log(error.message)
			})
		await page.waitFor(1000)
		log('Type limit number and save')
		await page.type(
			'input[name="Total Credits"]',
			likeCampaign.limit.toString()
		)
		await page.click('a[title="Save Changes"]')
		await page.waitFor(2000)
		log('Activate campaign')
		await page
			.evaluate(
				likeCampaign => {
					var selector = jQuery(
						`tr[id^="links"]:contains('${likeCampaign.link}')`
					)
						.parent()
						.parent()
					selector.find('select[name^="add-facebook-credits-id"').val(likeCampaign.costPerOne)
					selector.find('a[onclick^="updatelink"').trigger('click')
				},

				likeCampaign
			)
			.catch(error => {
				log(error.message)
			})
		totalCampaingnsTarget += parseInt(campagnLimit) / parseInt(campaign.cost_per_one)
		const createdLikeCampaign = await createLikeCampaign({
			name: `#${index + 1} for user campaign #${campaign.id} in account ${
				accounts[index].username
			}`,
			limit: parseInt(campagnLimit) / parseInt(campaign.cost_per_one),
			user_compaign_id: campaign.id,
			account_id: accounts[index].id,
			status: 'ACTIVE'
		})
		createdLikeCampaigns.push(createdLikeCampaign)
		if (totalCampaingnsTarget >= parseInt(campaign.target)) {
			updateUserCampaign(campaign.id, { status: 'ACTIVE' })
			await browser.close()
			break
		} else {
			await browser.close()
		}
	}
	if (
		totalCampaingnsTarget < parseInt(campaign.target) &&
		createdLikeCampaigns.length > 0
	) {
		updateUserCampaign(campaign.id, { status: 'PARTIALLY_ACTIVE' })
		await browser.close()
	}
	log('Done!')
	return createdLikeCampaigns
}

module.exports = startCampaign
