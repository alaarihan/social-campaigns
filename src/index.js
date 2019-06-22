require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const startEarning = require('./earning')
const startCampaign = require('./startCampaign')
const cancelCampaign = require('./cancelCampaign')

const app = express()

function ExpressError(status, msg) {
	var err = new Error(msg)
	err.status = status
	return err
}

app.use(bodyParser.json())

app.use('/run', function(req, res, next) {
	var key = req.query['api-key'] || req.headers['api-key']

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

app.post('/run/startCampaign', async function(req, res, next) {
	console.log(req.body)
	if (
		!req.body.event ||
		!req.body.event.data ||
		!req.body.event.data.new ||
		!req.body.event.data.new.id
	)
		return next(ExpressError(400, 'Campaign info is required!'))
	const campaign = req.body.event.data.new
	const createdCampaigns = await startCampaign(campaign)
	res.send(createdCampaigns)
})
app.post('/run/cancelCampaign', async function(req, res, next) {
	if (
		!req.body.event ||
		!req.body.event.data ||
		!req.body.event.data.new ||
		!req.body.event.data.new.id
	)
		return next(ExpressError(400, 'Campaign info is required!'))
	const campaign = req.body.event.data.new
	if (campaign.status !== 'CANCELED') return res.send('Nothing to do!')
	const canceledCampaigns = await cancelCampaign(campaign)
	res.send(canceledCampaigns)
})

app.listen({ port: process.env.PORT || 4001 }, () =>
	console.log(`🚀 Server ready at http://localhost:4001`)
)
