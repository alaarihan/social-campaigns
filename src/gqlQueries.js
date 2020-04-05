const gqlQueries = {
	getAccounts: `query account($order_by: [account_order_by!], $where: account_bool_exp){
    account(order_by: $order_by, where: $where) {
      id
      username
      password
      status
      last_activity
      credit
      status_duration
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
	createLog: `mutation insert_log($message: String, $type: String, $host_name: String $account_id: Int){
    insert_log(objects: { message: $message, type: $type, host_name: $host_name account_id: $account_id }) {
      affected_rows
    }
  }`,
	createLikeCampaign: `mutation insert_like_campaign($objects: [like_campaign_insert_input!]!){
    insert_like_campaign(objects: $objects) {
      affected_rows
      returning{
        id
        name
        limit
        status
        type
      }
    }
  }`,
	updateLikeCampaign: `mutation update_like_campaign($_set: like_campaign_set_input, $where: like_campaign_bool_exp!){
    update_like_campaign(_set: $_set, where: $where) {
      affected_rows
      returning{
        id
        name
        limit
        status
        type
      }
    }
  }`,
	getCampaigns: `query campaign($order_by: [campaign_order_by!], $where: campaign_bool_exp){
    campaign(order_by: $order_by, where: $where) {
      id
      target
      progress
      status
      link
      type
      like_campaigns{
        id
        progress
        limit
        account{
          id
          username
          password
          status
          credit
        }
      }
      
    }
  }`,
	updateCampaign: `mutation update_campaign($_set: campaign_set_input, $where: campaign_bool_exp!){
    update_campaign(_set: $_set, where: $where) {
        returning{
        id
        like_campaigns{
          id
        }
        }
    }
  }`,
	getSettings: `query setting($order_by: [setting_order_by!], $where: setting_bool_exp){
    setting(order_by: $order_by, where: $where) {
      id
      name
      value
    }
  }`
}

module.exports = gqlQueries
