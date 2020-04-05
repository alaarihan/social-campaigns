import { log } from '../apiQueries'
const sharp = require('sharp')
const fetch = require('node-fetch')
const canvas = require('canvas')
require('@tensorflow/tfjs-node')
const tmImage = require('@teachablemachine/image')
const JSDOM = require('jsdom').JSDOM

global.window = new JSDOM(
	`<body><script>document.body.appendChild(document.createElement("hr"));</script></body>`
).window
global.document = window.document
global.fetch = fetch

const recognizeShapes = async function(page, where) {
	if (!page) return log('No Puzzle to recognize shapes', 'ERROR')
	if (!where) {
		where = page.url()
	}
	log(`Recognize Shapes from Puzzle in ${where}`)
	const URL = 'https://teachablemachine.withgoogle.com/models/UB2FKRrgJ/'
	const modelURL = URL + 'model.json'
	const metadataURL = URL + 'metadata.json'

	// load the model and metadata
	// Refer to tmImage.loadFromFiles() in the API to support files from a file picker
	// or files from your local hard drive
	const model = await tmImage.load(modelURL, metadataURL)

	const puzzleEl = await page.$('#result')
	if (!puzzleEl) {
		log('puzzleEl not found!', 'ERROR')
		return false
	}

	const image = await puzzleEl.screenshot()
	// await sharp(image).toFile(`puzzleEl.jpg`)
	let shapes = []
	let width = 64
	let height = 63
	let left = 0
	if (where === 'Bonus page') {
		left = 15
	}
	for (let i = 0; i <= 6; i++) {
		const puzzlescreenImage = await sharp(image)
			.extract({ left, top: 0, width, height })
			.toBuffer()
			//.toFile(`icon-${i}.jpg`)
			.catch(err => {
				console.log(err)
			})
		// await sharp(puzzlescreenImage).toFile(i+'.jpg')

		left += width
		const prediction = await getPrediction(
			model,
			_arrayBufferToBase64(puzzlescreenImage)
		)
		if (prediction && prediction[0]) {
			prediction[0].index = i
			shapes.push(prediction[0])
		}
	}
	let sameShapesIndexes = []
	shapes.forEach(shape => {
		const similarShapes = shapes.filter(
			item => item.className === shape.className
		)
		if (similarShapes.length > 1) {
			sameShapesIndexes = similarShapes.map(item => item.index)
		}
	})
	return { shapes, sameShapesIndexes }
}

function getPrediction(model, data) {
	return new Promise((resolve, reject) => {
		const can = canvas.createCanvas(64, 64)
		const ctx = can.getContext('2d')
		const img = new canvas.Image()
		img.onload = async () => {
			ctx.drawImage(img, 0, 0, 64, 64)

			const prediction = await model.predictTopK(can, 1)
			// console.log(prediction);
			resolve(prediction)
		}
		img.onerror = err => {
			reject(err)
		}
		img.src = 'data:image/png;base64,' + data
	})
}

function _arrayBufferToBase64(buffer) {
	var binary = ''
	var bytes = new Uint8Array(buffer)
	var len = bytes.byteLength
	for (var i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i])
	}
	return window.btoa(binary)
}

module.exports = recognizeShapes
