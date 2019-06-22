const gqlQueries = {
	getAccounts: `query account($order_by: [account_order_by!], $where: account_bool_exp){
    account(order_by: $order_by, where: $where) {
      id
      username
      password
      status
      lastActivity
      credit
    }
  }`,
	updateAccount: `mutation update_account($_set: account_set_input, $where: account_bool_exp!){
    update_account(_set: $_set, where: $where) {
        returning{
        id
        username
        }
    }
  }`,
	createLog: `mutation insert_log($message: String, $type: String, $hostName: String $account_id: Int){
    insert_log(objects: { message: $message, type: $type, hostName: $hostName account_id: $account_id }) {
      affected_rows
    }
  }`,
	createLikeCampaign: `mutation insert_likeCampaign($objects: [likeCampaign_insert_input!]!){
    insert_likeCampaign(objects: $objects) {
      affected_rows
      returning{
        id
        name
        limit
        status
      }
    }
  }`,
	updateLikeCampaign: `mutation update_likeCampaign($_set: likeCampaign_set_input, $where: likeCampaign_bool_exp!){
    update_likeCampaign(_set: $_set, where: $where) {
      affected_rows
      returning{
        id
        name
        limit
        status
      }
    }
  }`,
	updateCampaign: `mutation update_campaign($_set: campaign_set_input, $where: campaign_bool_exp!){
    update_campaign(_set: $_set, where: $where) {
        returning{
        id
        likeCampaigns{
          id
        }
        }
    }
  }`
}

module.exports = gqlQueries
