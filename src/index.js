require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const startEarning = require('./earning')
const startCampaign = require('./startCampaign')
const cancelCampaign = require('./cancelCampaign')
const updateCampaignProgress = require('./updateCampaignProgress')
const updateActiveCampaignsProgress = require('./updateActiveCampaignsProgress')
const deleteLogs = require('./apiQueries/deleteLogs')

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
	let force = req.query['force'] || req.headers['force']
	force = force === 'yes' ? true : false
	startEarning(force)
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
	if (campaign.status !== 'PENDING') {
		res.send(`Nothing to do, because campaign status is ${campaign.status}`)
		return
	}
	const createdCampaigns = await startCampaign(campaign)
	if (createdCampaigns instanceof Error) {
		return next(ExpressError(400, createdCampaigns.message))
	}

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

	let canceledCampaigns = null
	if (
		campaign.status === 'CANCEL' ||
		(campaign.status === 'COMPLETED' &&
			campaign.repeat !== 0 &&
			campaign.repeat > campaign.repeated) ||
		(campaign.status === 'COMPLETED' && campaign.repeat === -1)
	) {
		canceledCampaigns = await cancelCampaign(campaign)
	} else {
		return res.send('Nothing to do!')
	}

	if (canceledCampaigns instanceof Error) {
		return next(ExpressError(400, canceledCampaigns.message))
	}

	res.send(canceledCampaigns)
})

app.post('/run/updateCampaignProgress', async function(req, res, next) {
	const campaign = req.body
	if (!campaign.id) return next(ExpressError(400, 'Campaign info is required!'))
	if (campaign.status !== 'ACTIVE') return res.send('Nothing to do!')
	const updatedCampaign = await updateCampaignProgress(campaign)
	if (updatedCampaign instanceof Error) {
		return next(ExpressError(400, updatedCampaign.message))
	}
	res.send(updatedCampaign)
})

app.get('/run/updateActiveCampaignsProgress', async function(req, res, next) {
	const updatedCampaigns = await updateActiveCampaignsProgress()
	if (updatedCampaigns instanceof Error) {
		return next(ExpressError(400, updatedCampaigns.message))
	}
	res.send(updatedCampaigns)
})

app.get('/run/cleanDB', async function(req, res, next) {
	let clean_db_enabled = await getSetting('enable_clean_db')
	if (clean_db_enabled !== 'yes') {
		console.log(`Can't update campaigns progress because it's disabled`)
		return false
	}
	let beforeDate = new Date()
	beforeDate.setMinutes(beforeDate.getMinutes() - 100)
	const deletedRows = await deleteLogs({ created_at: { _lt: beforeDate } })
	res.send(JSON.stringify(deletedRows))
})

app.listen({ port: process.env.PORT || 4001 }, () =>
	console.log(`🚀 Server ready at http://localhost:4001`)
)
