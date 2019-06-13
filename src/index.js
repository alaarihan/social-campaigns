require('dotenv').config()
const os = require('os')
const puppeteer = require('puppeteer')
const { GraphQLClient } = require('graphql-request')
import gqlQueries from './gqlQueries'

const client = new GraphQLClient(process.env.HASURA_URI, {
  headers: {
    'x-hasura-admin-secret': process.env.HASURA_SECRET
  }
})

const hostName = os.hostname()
var account = null
async function mainFunction() {
  account = await getAccount()
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  const page = await browser.newPage()
  await page.goto('https://google.com')
  await page.screenshot({ path: 'example.png' })
  await updateLastActivity(account.id);
  await browser.close()
}
; (async () => {
  mainFunction()
})()

// Get an offline account
async function getAccount() {
  await updateInactiveAccountsState()
  let variables = {
    order_by: { lastActivity: 'asc' },
    where: { status: { _eq: 'OFFLINE' } }
  }

  return await client
    .request(gqlQueries.getAccounts, variables)
    .then(function (data) {
      console.log(data)
      if (data.account.length < 1) {
        return false
      }
      changeAccountStatus(data.account[0].id, 'ONLINE')
      return data.account[0]
    })
    .catch(function (error) {
      log("Couldn't get accounts ", error, 'ERROR')
    })
}

async function updateInactiveAccountsState() {
  // Set online accounts to offline status after 4 inactive minutes
  let lastActivity = new Date();
  lastActivity.setMinutes(lastActivity.getMinutes() - 4);
  let variables = {
    order_by: { lastActivity: 'asc' },
    where: { status: { _eq: 'ONLINE' }, lastActivity: { _lt: lastActivity } }
  }
  await client.request(gqlQueries.getAccounts, variables).then(function (data) {
    console.log(data)
    for (var i = 0, len = data.account.length; i < len; i++) {
      changeAccountStatus(data.account[i].id, "OFFLINE");
    }
  }).catch(function (error) {
    console.log(error)
    log("Couldn't get onilne accounts to check last activity ", error, "ERROR");
  });

  // Set disabled accounts to offline status after 6 inactive hours
  await lastActivity.setHours(lastActivity.getHours() - 6);
  variables = await {
    order_by: { lastActivity: 'asc' },
    where: { status: { _eq: 'DISABLED' }, lastActivity: { _lt: lastActivity } }
  }
  await client.request(gqlQueries.getAccounts, variables).then(function (data) {
    for (var i = 0, len = data.account.length; i < len; i++) {
      changeAccountStatus(data.account[i].id, "OFFLINE");
    }
  }).catch(function (error) {
    log("Couldn't get disabled accounts to check last activity ", error, "ERROR");
  });
}

async function changeAccountStatus(id, status) {
  let variables = {
    _set: { status },
    where: { id: { _eq: id } }
  }

  await client.request(gqlQueries.updateAccount, variables).then(function (data) {
    log(`Account ${data.update_account.returning[0].username} status changed to ${status}`);
  }).catch(function (error) {
    console.log(error)
    // log("Couldn't change account status ", error, "ERROR");
  });
}

async function updateLastActivity(id){
  let now = new Date();
  let variables = {
    _set: { lastActivity: now },
    where: { id: { _eq: id } }
  }

  await client.request(gqlQueries.updateAccount, variables).then(function(data) {
      log(`Account ${data.update_account.returning[0].username} logging last activity ${now}`);
  }).catch(function(error) {
      log("Couldn't change account status ", error, "ERROR");
  });
}

function log(message, type) {
  if (!type) {
    type = 'INFO';
  }
  console.log(message);
  let variables = {}

  if (!account || !account.id) {
    variables = {
      message,
      type,
      hostName
    }
  } else {
    variables = {
      message,
      type,
      hostName,
      account_id: account.id
    }
  }

  client.request(gqlQueries.createLog, variables).then(function (data) {

  }).catch(function (error) {
    console.log("Couldn't create Log " + error);
  });
}