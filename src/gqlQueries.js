const gqlQueries = {
	getAccounts: `query account($order_by: [account_order_by!], $where: account_bool_exp){
    account(order_by: $order_by, where: $where) {
      id
      username
      password
      status
      lastActivity
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
  }`
}

module.exports = gqlQueries
