import { log } from '../apiQueries'
const recognizeShapes = require('./recognizeShapes')
const clickPuzzleMap = async function(page, where) {
	if (!page) return log('No Puzzle to click', 'ERROR')
	if (!where) {
		where = page.url()
	}
	const shapes = await recognizeShapes(page, where)
	console.log('shapes', shapes)
	if (!shapes || !shapes.sameShapesIndexes || shapes.sameShapesIndexes.length < 1) {
		log('no similar recognizing shapes has found!', 'ERROR')
		return false
	}
	log(`Click Puzzle in ${where}`)
	await page
		.evaluate(function(indexes) {
			var mapArea = jQuery('#result .captchaImage')
			mapArea.each(function(index) {
				if (indexes.includes(index)) {
					var scriptVal = jQuery(this).attr('onclick')
					scriptVal = scriptVal.replace('javascript:', '')
					eval(scriptVal)
					return false
				}
			})
		}, shapes.sameShapesIndexes)
		.catch(error => {
			log(error.message, 'ERROR')
		})
	await page.waitFor(3000)
}

module.exports = clickPuzzleMap
