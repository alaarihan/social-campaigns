require('dotenv').config()
const express = require('express')
const startEarning = require('./earning')

const app = express()

function ExpressError(status, msg) {
	var err = new Error(msg)
	err.status = status
	return err
}

app.use('/run', function(req, res, next) {
	var key = req.query['api-key']

	// key isn't present
	if (!key) return next(ExpressError(400, 'api key required'))

	// key is invalid
	if (key !== process.env.API_KEY)
		return next(ExpressError(401, 'invalid api key'))

	// all good, store req.key for route access
	req.key = key
	next()
})

app.get('/run/earning', function(req, res, next) {
	startEarning()
	res.send('Running')
})

app.listen({ port: process.env.PORT || 4001 }, () =>
	console.log(`🚀 Server ready at http://localhost:4001`)
)
