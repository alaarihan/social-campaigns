const { getCurrentAccount } = require('../setAccount')
const { log, updateLastActivity } = require('../apiQueries')
const clickPuzzleMap = require('./clickPuzzleMap')
const updateCredit = require('./updateCredit')

async function clickAds(page, browser) {
	const PageAds = await checkPageAds(page)
	if (!PageAds) {
		return false
	}
	let clickableAds = await checkClickableAds(page)
	if (!clickableAds) {
		return false
	}
	const account = await getCurrentAccount()
	let clickAdsloop = 1
	while (clickableAds > 0) {
		try {
			log(`Click to view new video #${clickAdsloop}`)
			clickAdsloop++
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
			log(`Required play time: ${counterNumber} seconds`)
			await iframe
				.waitForSelector('iframe', { timeout: 10000 })
				.catch(async err => {
					await pages[1].close()
					throw new Error(`Couldn't find video frame! ${err.message}`)
				})
			const iframe2 = await iframe.childFrames()[0]
			if (!iframe2) {
				throw new Error(`Couldn't find youtube frame!`)
			}
			await iframe2.waitForSelector('.ytp-large-play-button')
			await iframe2.click('.ytp-large-play-button')
			await iframe2.waitFor(8000).then(async () => {
				const videoDuration = await iframe2.evaluate(
					() => document.querySelector('.ytp-time-duration').innerText
				)
				log(`Video duration: ${videoDuration}`)
				let a = videoDuration.split(':') // split it at the colons
				let seconds = +a[0] * 60 + +a[1] - 1
				if (a.length > 2) {
					seconds = +a[0] * 60 * 60 + +a[1] * 60 + +a[2] - 1
				}

				counterText = await iframe.evaluate(
					() => document.querySelector('#counter').parentElement.innerText
				)
				let currentCounterNumber = parseInt(
					counterText.substring(counterText.indexOf('/') - 1).slice(0, -12)
				)
				if (currentCounterNumber === 0) {
					log('The video is not playing!')
				} else {
					let repeateTimes = false
					if (seconds < counterNumber) {
						repeateTimes = Math.ceil(counterNumber / seconds) - 1
						await iframe2.waitFor(seconds * 1000)
						for (let index = 1; index < repeateTimes; index++) {
							try{
								await iframe2.waitForSelector('.ytp-play-button')
								log(`Click replay #${index}`)
								await iframe2.click('.ytp-play-button')
								await iframe2.waitFor(seconds * 1000)
							}catch(err){
								log(`Couldn't click reply ${err.message}`)
							}
						}
					} else {
						await iframe2.waitFor(counterNumber * 1000)
					}

					const puzzleIframe = await iframe.childFrames()[1]
					if (puzzleIframe) {
						await clickPuzzleMap(puzzleIframe, 'video window')
						await iframe
							.waitForSelector('#cpcdiv + script + br + br+ div', {
								timeout: 4000
							})
							.then(async () => {
								const guessText = await iframe.evaluate(
									() =>
										document.querySelector('#cpcdiv + script + br + br+ div')
											.innerText
								)
								log(guessText)
							})
							.catch(err => {
								console.log(err)
								log("Couldn't get the text after clicking the puzzle")
							})
					}else{
						log(`Puzzle didn't show up!`)
					}
				}
			})
			await pages[1].close()
			await page.waitFor(3000)
			updateLastActivity(account.id)
			clickableAds = await checkClickableAds(page)
			await updateCredit(page, account, false)
		} catch (err) {
			log(`Error happened in clickAds ${err.message}`)
			updateLastActivity(account.id)
			if (pages[1]) {
				await pages[1].close()
			}
			clickableAds = await checkClickableAds(page)
		}
	}
}

async function checkClickableAds(page) {
	const AdsElements = await page.$$('.earn_pages_button')
	if (AdsElements.length < 1) {
		log('No clickable ads found')
		return false
	}
	return AdsElements.length
}
async function checkPageAds(page) {
	const AdsElements = await page.$$('td[id^=task]')
	if (AdsElements.length < 1) {
		log('No ads elements found in the page')
		return false
	}
	log(`Found ${AdsElements.length} ads elements`)
	return AdsElements.length
}

module.exports = clickAds
