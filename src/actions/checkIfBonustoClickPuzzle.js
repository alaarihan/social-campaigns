const clickPuzzleMap = require('./clickPuzzleMap')
async function checkIfBonustoClickPuzzle(page, redirect){
    if(!page)
        return false;
	if(!redirect){
		redirect = 'https://www.like4like.org/user/earn-youtube-video.php'
	}
	if (page.url() === 'https://www.like4like.org/user/bonus-page.php') {
		await clickPuzzleMap(page, 'Bonus page')
		await page.goto(redirect)
		return true
	}
	return false
}

module.exports = checkIfBonustoClickPuzzle