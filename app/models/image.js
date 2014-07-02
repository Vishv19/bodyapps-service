/*
 * Copyright (c) 2014, Fashiontec (http://fashiontec.org)
 * Licensed under LGPL, Version 3
 */

/*
 * Image model for the bodyapps backend. 
 * 
 * Model is defined via Mongoose. Image can be uniquely identified 
 * by the 'body-part' and 'm_id'.
 */

module.exports = db.model('Image', {
  side: String,
  m_id: String,
  type: String, //jpg or png
  binary_data: String //base64 encoded string
});
