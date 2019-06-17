import { getCurrentAccount } from '../setAccount'

import { log, updateLastActivity } from '../apiQueries'
const clickPuzzleMap = require('../actions/clickPuzzleMap')

async function clickAds(page, browser) {
	const account = await getCurrentAccount()
	const AdsElements = await page.$$('.earn_pages_button')
	for (let index = 0; index < AdsElements.length; index++) {
		await page.click('.earn_pages_button:first-child')
		await page.waitFor(2000)
		const pages = await browser.pages()
		// console.log(pages.length)
		// console.log(pages[2])
		// await page.waitForNavigation()
		// AdsElements[index].click()
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
		const iframe2 = await iframe.childFrames()[0]
		//const iframe1 = await iframe.childFrames();
		// console.log(iframe)

		// await page.waitFor(1000)
		// const iframe2 = await iframe.frames()[0];
		await iframe2.waitForSelector('.ytp-large-play-button')
		await iframe2.click('.ytp-large-play-button')
		await iframe2.waitFor(3000).then(async () => {
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
				await iframe2.waitFor(counterNumber * 1000)
				const puzzleIframe = await iframe.childFrames()[1]
				await clickPuzzleMap(puzzleIframe)
				await page.waitFor(2000)
			}
		})

		// await iframe.waitForSelector()
		await pages[1].close()
		await page.waitFor(3000)
		updateLastActivity(account.id)
	}
}

module.exports = clickAds
