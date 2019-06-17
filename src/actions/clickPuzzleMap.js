import { log } from '../apiQueries'
const clickPuzzleMap = async function(page) {
	log(`Click Puzzle in ${page.url()}`)
	await page
		.evaluate(function() {
			var mapArea = jQuery('#result area')
			mapArea.each(function() {
				var scriptVal = jQuery(this).attr('onclick')
				scriptVal = scriptVal.replace('javascript:', '')
				eval(scriptVal)
			})
		})
		.catch(error => {
			log(error.message, 'ERROR')
		})
}

module.exports = clickPuzzleMap
