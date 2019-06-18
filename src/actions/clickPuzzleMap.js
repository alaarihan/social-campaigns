import { log } from '../apiQueries'
const clickPuzzleMap = async function(page, where) {
	if (!page) return log('No Puzzle to click', 'ERROR')
	if(!where){
		where = page.url()
	}
	log(`Click Puzzle in ${where}`)
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
