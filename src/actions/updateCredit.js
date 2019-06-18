import { getCurrentAccount } from '../setAccount'
import {
	updateAccountCredit,
	log
} from '../apiQueries'
const clickPuzzleMap = require('./clickPuzzleMap')

async function updateCredit(page) {
    const account = await getCurrentAccount()
    if(!page) return false
    const currentPageUrl = page.url();
    // if (currentPageUrl !== 'https://www.like4like.org/user/earn-youtube-video.php') {
    //     await page.goto('https://www.like4like.org/user/earn-youtube-video.php')
    // }
    if (page.url() === 'https://www.like4like.org/user/bonus-page.php') {
        await clickPuzzleMap(page)
        await page.waitFor(2000)
        await page.goto('https://www.like4like.org/user/earn-youtube-video.php')
    }
    const currentCredit = await page.evaluate(
        () => document.querySelector('#earned-credits').innerText
    ).catch(() => {
        log('Couldn\'t get current credit', 'ERROR')
    })
    if(currentCredit){
        updateAccountCredit(account.id, parseInt(currentCredit))
    }
}

module.exports = updateCredit
