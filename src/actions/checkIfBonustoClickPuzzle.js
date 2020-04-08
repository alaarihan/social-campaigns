const clickPuzzleMap = require('./clickPuzzleMap')
async function checkIfBonustoClickPuzzle(page){
    if(!page)
        return false;

	if (page.url() === 'https://www.like4like.org/user/bonus-page.php') {
		await clickPuzzleMap(page, 'Bonus page')
		await page.goto('https://www.like4like.org/user/earn-youtube-video.php')
		return true
	}
	return false
}

module.exports = checkIfBonustoClickPuzzle