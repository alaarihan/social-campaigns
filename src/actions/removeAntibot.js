const removeAntibot = async function(page) {
	await page
		.evaluate(function() {
			jQuery('a.earn_pages_button').each(function() {
				if (
					jQuery(this)
						.css('background-image')
						.indexOf('antibot') >= 0
				) {
					jQuery(this)
						.parents('td.fld')
						.remove()
				}
			})
		})
		.catch(error => {
			log(error.message, 'ERROR')
		})
}

module.exports = removeAntibot
