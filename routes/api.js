/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;
//Example connection: MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {
  const DB_URI = process.env.DB_URI;
  const books  = 'books'
  app.route('/api/books')
    .get(function (req, res){
      MongoClient.connect( DB_URI )      //response will be array of book objects
        .then( db => {
          const collection = db.collection(books);
          collection.find({}).toArray( ( err, doc ) => {
            if ( !err ) res.json( doc )  //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
            else        res.send( err )
          })
        })
        .catch( err => { res.send( err ) } )
    })
    
    .post(function (req, res){
      var title     = req.body.title;
      const newBook = {
        title        : title,
        comments     : [],
      }
      if ( title ){
        MongoClient.connect(DB_URI)  //response will contain new book object including atleast _id and title
          .then( db => {
            const collection = db.collection( books );
            collection.insertOne( newBook )
              .then( doc => {
                newBook._id = doc.insertedId;
                res.json( newBook )
              })
              .catch( err => res.send( err ));
          })
          .catch( err => res.send( err ) );
      }
      else {
        res.send('missing title')
      }
    })
    
    .delete(function(req, res){
      MongoClient.connect(DB_URI)    //if successful response will be 'complete delete successful'
        .then ( db => {
          const collection =  db.collection( books );
          collection.deleteMany({})
            .then( doc => {
              res.send( 'complete delete successful');
            })
            .catch( err => res.send( err ))
        })
        .catch( err => res.send( err ))
    });



  app.route('/api/books/:id')
    .get(function (req, res){
      var bookid   = req.params.id;
      const query  = {
        _id : new ObjectId(bookid)
      } 
      MongoClient.connect(DB_URI)         //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
        .then( db => {
          const collection = db.collection( books );
          collection.find( query ).toArray( )
            .then( doc => {
              if ( doc.length === 0 ) { res.send( 'no book exists') } 
              else {
                res.json(doc[0])
              }
            })
            .catch( err => res.send( err ))
        })
        .catch( err => res.send( err ))
    })
    
    .post(function(req, res){
      var bookid = req.params.id;
      var comment = req.body.comment;
      const query  = {
        _id : new ObjectId(bookid)
      } 
      MongoClient.connect(DB_URI)        //json res format same as .get
        .then( db => {
          const collection = db.collection( books )
          collection.findAndModify( query, {}, { $push: { comments : comment  } },{ new : true, upsert: false }, function(err,doc){
            if (err) res.send(err);
            res.json(doc.value);         //doc.value contain schema value 
          } )
            
        })
        .catch( err => res.send( err ))
    })
    
    .delete(function(req, res){
      var bookid = req.params.id;
      const query = {
        _id : new ObjectId( bookid )
      }
      MongoClient.connect(DB_URI)      //if successful response will be 'delete successful'
        .then( db => {
          const collection = db.collection( books )
          collection.findOneAndDelete( query )
            .then( doc => res.send( 'delete successful')) 
            .catch( err => res.send( err ))
        })
    });
  
};
