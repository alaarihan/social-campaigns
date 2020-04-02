const { getCurrentAccount } = require('../setAccount')
const { log, updateLastActivity } = require('../apiQueries')
const clickPuzzleMap = require('./clickPuzzleMap')

async function clickAds(page, browser) {
	const PageAds = await checkPageAds(page)
	if(!PageAds){
		return false
	}
	const clickableAds = await checkClickableAds(page)
	if(!clickableAds){
		return false
	}
	const account = await getCurrentAccount()
	for (let index = 0; index < PageAds; index++) {
		await page.click('.earn_pages_button:first-child')
		await page.waitFor(2000)
		const pages = await browser.pages()
		await pages[1].waitForSelector('iframe')
		const iframe = await pages[1].frames()[1]
		await iframe.waitForSelector('#player')
		let counterText = await iframe.evaluate(
			() => document.querySelector('#counter').parentElement.innerText
		)
		let counterNumber = parseInt(
			counterText.substring(counterText.indexOf('/') + 2).slice(0, -8)
		)
		console.log(counterNumber)
		await iframe
			.waitForSelector('iframe', { timeout: 10000 })
			.catch(async () => {
				log("Couldn't find youtube frame!", 'ERROR')
				await pages[1].close()
			})
		const iframe2 = await iframe.childFrames()[0]
		if (!iframe2) {
			break
		}
		await iframe2.waitForSelector('.ytp-large-play-button')
		await iframe2.click('.ytp-large-play-button')
		await iframe2.waitFor(5000).then(async () => {
			const videoDuration = await iframe2.evaluate(
				() => document.querySelector('.ytp-time-duration').innerText
			)
			log(`Video duration: ${videoDuration}`)
			let a = videoDuration.split(':'); // split it at the colons
			const seconds = (+a[0] * 60 + (+a[1]))
			console.log('seconds', seconds)
			
			counterText = await iframe.evaluate(
				() => document.querySelector('#counter').parentElement.innerText
			)
			let currentCounterNumber = parseInt(
				counterText.substring(counterText.indexOf('/') - 1).slice(0, -12)
			)
			console.log(currentCounterNumber)
			if (currentCounterNumber === 0) {
				log('The video is not playing!')
			} else {
				let repeateTimes = false
				if(seconds < counterNumber){
					repeateTimes = Math.ceil(counterNumber/seconds) - 1
					for (let index = 0; index < repeateTimes; index++) {
						await iframe2.waitFor(seconds * 1000)
						await iframe2.waitForSelector('.ytp-play-button')
						await iframe2.click('.ytp-play-button')
					}
				}else{
					await iframe2.waitFor(counterNumber * 1000)
				}
				
				const puzzleIframe = await iframe.childFrames()[1]
				await clickPuzzleMap(puzzleIframe, 'video window')
				await puzzleIframe.waitFor(2000)
			}
		})
		await pages[1].close()
		await page.waitFor(3000)
		updateLastActivity(account.id)
		const clickableAds = await checkClickableAds(page)
		if(!clickableAds){
			break;
		}
	}
}

async function checkClickableAds(page){
	const AdsElements = await page.$$('.earn_pages_button')
	if (AdsElements.length < 1) {
		log('No clickable ads found')
		return false
	}
	return AdsElements.length
}
async function checkPageAds(page){
	const AdsElements = await page.$$('td[id^=task]')
	if (AdsElements.length < 1) {
		log('No ads elements found in the page')
		return false
	}
	log(`Found ${AdsElements.length} ads elements`)
	return AdsElements.length
}

module.exports = clickAds
