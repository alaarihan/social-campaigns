const { getCurrentAccount } = require('../setAccount')
const { log, updateLastActivity, getSetting } = require('../apiQueries')
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
	while (clickableAds > 0 && clickAdsloop < 1000) {
		const earning_enabled = await getSetting('enable_earning')
		if (earning_enabled !== 'yes') {
			throw new Error(`Can't run earning because it's disabled`)
		}
		log(`Click to view new video #${clickAdsloop}`)
		clickAdsloop++
		await page.click('.earn_pages_button:first-child')
		await page.waitFor(2000)
		const pages = await browser.pages()
		const videoWindow = pages[1]
		if (!videoWindow) {
			throw new Error('Video window has not found!')
		}
		try {
			await videoWindow.waitForSelector('iframe')
			const parentIframe = await videoWindow.frames()[1]
			if (!parentIframe) {
				log('videoWindow parent frame has not found!')
				videoWindow.close()
				continue
			}
			await parentIframe.waitForSelector('#player')
			let counterText = await parentIframe.evaluate(
				() => document.querySelector('#counter').parentElement.innerText
			)
			let counterNumber = parseInt(
				counterText.substring(counterText.indexOf('/') + 2).slice(0, -8)
			)
			log(`Required play time: ${counterNumber} seconds`)
			await parentIframe
				.waitForSelector('iframe', { timeout: 10000 })
				.catch(async err => {
					await videoWindow.close()
					throw new Error(`Couldn't find video frame! ${err.message}`)
				})
			const youtubeIframe = await parentIframe.childFrames()[0]
			if (!youtubeIframe) {
				throw new Error(`Couldn't find youtube frame!`)
			}
			await youtubeIframe.waitForSelector('.ytp-large-play-button')
			await youtubeIframe.click('.ytp-large-play-button')
			await youtubeIframe.waitFor(8000).then(async () => {
				const videoDuration = await youtubeIframe.evaluate(
					() => document.querySelector('.ytp-time-duration').innerText
				)
				log(`Video duration: ${videoDuration}`)
				let a = videoDuration.split(':') // split it at the colons
				let seconds = +a[0] * 60 + +a[1] - 1
				if (a.length > 2) {
					seconds = +a[0] * 60 * 60 + +a[1] * 60 + +a[2] - 1
				}

				counterText = await parentIframe.evaluate(
					() => document.querySelector('#counter').parentElement.innerText
				)
				let currentCounterNumber = parseInt(
					counterText.substring(counterText.indexOf('/') - 1).slice(0, -12)
				)
				if (currentCounterNumber === 0) {
					log('The video is not playing!')
				} else {
					let repeatTimes = false
					if (seconds < counterNumber) {
						repeatTimes = Math.ceil(counterNumber / seconds) - 1
						if (repeatTimes > 100) {
							repeatTimes = 1
						}
						await videoWindow.waitFor(seconds * 1000)
						for (let index = 0; index < repeatTimes; index++) {
							try {
								await youtubeIframe.waitForSelector('.ytp-play-button')
								log(`Click replay #${index + 1}`)
								await youtubeIframe.click('.ytp-play-button')
								await videoWindow.waitFor(seconds * 1000)
							} catch (err) {
								log(`Couldn't click reply ${err.message}`)
							}
						}
					} else {
						await videoWindow.waitFor(counterNumber * 1000)
					}

					let puzzleIframe = false
					await parentIframe
						.waitForSelector('#cpcdiv iframe', {
							timeout: 10000
						})
						.then(async () => {
							puzzleIframe = await parentIframe.childFrames()[1]
							if (puzzleIframe) {
								await clickPuzzleMap(puzzleIframe, 'video window')
								await parentIframe
									.waitForSelector('#cpcdiv + script + br + br+ div', {
										timeout: 4000
									})
									.then(async () => {
										const guessText = await parentIframe.evaluate(
											() =>
												document.querySelector(
													'#cpcdiv + script + br + br+ div'
												).innerText
										)
										log(guessText)
									})
									.catch(err => {
										console.log(err)
										log("Couldn't get the text after clicking the puzzle")
									})
							}
						})
						.catch(async err => {
							log(`Puzzle didn't show up! video url: ${youtubeIframe.url()}`)
						})
				}
			})
			await videoWindow.close()
			await page.waitFor(3000)
			updateLastActivity(account.id)
			clickableAds = await checkClickableAds(page)
			await updateCredit(page, account, false)
		} catch (err) {
			log(`Error happened in clickAds ${err.message}`)
			updateLastActivity(account.id)
			if (videoWindow) {
				await videoWindow.close()
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
