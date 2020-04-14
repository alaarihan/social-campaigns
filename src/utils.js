const { GraphQLClient } = require('graphql-request')

const gqlClient = new GraphQLClient(process.env.HASURA_URI, {
	headers: {
		'x-hasura-admin-secret': process.env.HASURA_SECRET
	}
})

const loginBlockedStatuses = ['BLOCKED', 'DISABLED', 'SUSPENDED', 'DEACTIVATED', 'NEED_EMAIL_VERIFY']

module.exports = {
	gqlClient,
	loginBlockedStatuses
}
