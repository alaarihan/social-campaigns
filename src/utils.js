const { GraphQLClient } = require('graphql-request')

const gqlClient = new GraphQLClient(process.env.HASURA_URI, {
	headers: {
		'x-hasura-admin-secret': process.env.HASURA_SECRET
	}
})

module.exports = {
	gqlClient
}
