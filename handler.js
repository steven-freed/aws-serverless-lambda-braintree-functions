'use strict';

var braintree = require('braintree');
// MARK: - Braintree Credentials 
var gateway = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId: "yourMerchantId",
  publicKey: "yourPublicKey",
  privateKey: "yourPrivateKey"
});

/////////////////////////////////////////////////////////////////////////////////
/////////// MARK: - Get Customer with Payment Methods  /////////////////////////
///////////////////////////////////////////////////////////////////////////////
/*
  Get payment methods associated with braintree id specified by the client
*/
module.exports.getCustomerPayMethods = (event, context, callback) => {

    let jsonObject = JSON.parse(event.body);
    let id = jsonObject.id;

gateway.customer.find(id, function(err, customer) {

  if(customer != null) 
  {
    let methods = customer.paymentMethods;

     const succTrans = {
                      statusCode: 200,
                      body: JSON.stringify({
                      response: "Customer methods obtained!",
                      paymentMethods: methods
                      })
                    };

    callback(null, succTrans);

  } else {

    const failedTrans = {
                          statusCode: 404,
                          body: JSON.stringify({
                          nonce_response: "Failed to get customer payment methods"
                          })
                        }; 

    callback(null, failedTrans);
  }

});

};


/////////////////////////////////////////////////////////////////////////////////
/////////// MARK: - Create Customer with Payment Nonce  ////////////////////////
///////////////////////////////////////////////////////////////////////////////
/*
  Creates a new payment method for a customer:
         if no customer exists we create a braintree id for the customer and store their payment method
         if customer exists we store their new payment method
*/
module.exports.newCustomerPayMethod = (event, context, callback) => {

  let jsonObject = JSON.parse(event.body);
  let id = jsonObject.id;
  let first = jsonObject.first;
  let last = jsonObject.last;
  let nonce = jsonObject.nonce;

   const failedTrans = {
                        statusCode: 404,
                        body: JSON.stringify({
                        nonce_response: "Failed to create customer payment method"
                        })
                      }; 

// Creates new customer with payment method when client sends Braintree id of "" 
// meaning a customer has not been created yet
   if (id == "") {

gateway.customer.create({
  firstName: first,
  lastName: last
}, function (err, result) {

  if (result.success) {

     const succTrans = {
                        statusCode: 200,
                        body: JSON.stringify({
                        nonce_response: "New payment method added successfully!",
                        customer_id: result.customer.id
                         })
                        };

    callback(null, succTrans);

} else {

   callback(null, failedTrans);
}

});

// Creates a new payment method for an existing customer with a Braintree id
} else {

gateway.customer.update(id, {
  paymentMethodNonce: nonce,
}, function (err, result) {

if (result.success){
   
   const succUpdate = {
                      statusCode: 200,
                      body: JSON.stringify({
                      nonce_response: "Customer Updated!"
                        })
                      };

   callback(null, succUpdate);
} else {

 callback(null, failedTrans);

}

});

}

}; 

/////////////////////////////////////////////////////////////////////////////////
/////////// MARK: - Get request to obtain client token  ////////////////////////
///////////////////////////////////////////////////////////////////////////////
/*
  Returns client token for existing or non-existing braintree user
  if customer has Braintree id their stored payment methods will be available in client
  if customer has no Braintree id they can still checkout as a guest
*/
module.exports.clientToken = (event, context, callback) => {

  let jsonObject = JSON.parse(event.body);
  let customer_Id = jsonObject.customerId;

  const succTrans = {
                    statusCode: 200,
                    body: JSON.stringify({
                    client_token: response.clientToken
                     })
                    };

  const failedTrans = {
                      statusCode: 404,
                      body: JSON.stringify({
                      nonce_response: "Failed to obtain client token form Braintree"
                        })
                      }; 

// Return token for guest checkout
  if (customer_Id == "") {

gateway.clientToken.generate({}, function (err, response) {
  
  if (response.success) {
    
      callback(null, succTrans);

    } else {

      callback(null, failedTrans);

    }
}); 

// Return token for returning customer
} else {

gateway.clientToken.generate({
  customerId: customer_Id
}, function (err, response) {
 
 if (response.success) {

      callback(null, succTrans);

    } else {

      callback(null, failedTrans);

    }

}); 

}
 
}; 

///////////////////////////////////////////////////////////////////////////////////////////////
/////////////// MARK: - Delete Existing Payment Method ///////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
/*
  Deletes a payment method for an existing Braintree user
*/
module.exports.deletePaymentMethod = (event, context, callback) => {

   let jsonOB = JSON.parse(event.body);
   let nonce = jsonOB.payment_method_nonce;

   const failedTran = {
                      statusCode: 404,
                      body: JSON.stringify({
                      nonce_response: "Failed Transaction"
                        })
                      }; 

   const successfulTran = {
                          statusCode: 200,
                          body: JSON.stringify({
                          nonce_response: "Successfully Deleted!"
                            })
                          };

  gateway.paymentMethod.delete(nonce, function (err) {
      if (err == null){

        callback(null, successfulTran);

      } else {

        callback(null, failedTran);
  }

});

}

///////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////// MARK: - Post Nonce to Braintree ///////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////
/*
  Posts a nonce for the transaction of a sale
*/
module.exports.postNonce = (event, context, callback) => {

   let jsonObject = JSON.parse(event.body);
   let user_Id = jsonObject.userId;
   let amount = jsonObject.amount;
   let payment_method_nonce = jsonObject.payment_method_nonce;

   const failedTrans = {
                      statusCode: 404,
                      body: JSON.stringify({
                      nonce_response: "Failed transaction"
                        })
                      }; 

   const succTrans = {
                          statusCode: 200,
                          body: JSON.stringify({
                          nonce_response: "Successful transaction!"
                            })
                          };

// Creates transaction for guest customer and does not store their payment information
// Braintree id of "" means non-existing customer (guest)
if (user_Id == ""){

   gateway.transaction.sale({
  amount: amount,
  paymentMethodNonce: payment_method_nonce,
  options: {
    submitForSettlement: true
  }
}, function (err, response) {

  if (response.success) {

   callback(null, successfulTran);

} else {

    callback(null, failedTran);
} 

});

// Creates transaction for returning customer using one of their stored payment methods or 
// pays with a new payment method, then stores that payment method
 } else {

    gateway.transaction.sale({
     amount: amount,
     paymentMethodNonce: payment_method_nonce,
     options: {
    submitForSettlement: true
  }
}, function (err, result) {

   if (result.success) {

   callback(null, succTrans);

} else {

    callback(null, failedTrans);
} 

}); 

}

};
