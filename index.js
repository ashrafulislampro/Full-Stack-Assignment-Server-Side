const express = require('express')
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const app = express()
app.use(cors());
app.use(bodyParser.json());

const port = process.env.PORT || 5000;


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q0pfb.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const collection = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_CONNECT}`);
  const collectionBuyProducts = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_CONNECTED}`);
  
  app.post('/addProducts', (req, res)=>{
    const products = req.body;
    collection.insertOne(products)
    .then(result =>{
      res.send(result.acknowledged === true);
    })
  });

  app.post('/addBuy', (req, res)=>{
    const buyProduct = req.body;
    collectionBuyProducts.insertOne(buyProduct)
    .then((result)=>{
      res.send(result.acknowledged === true);
    })
  });

  app.get('/buyProducts' , (req, res)=>{
      collectionBuyProducts.find({email : req.query.email})
      .toArray((err, documents) =>{
        res.send(documents)
      })
  })


  app.get('/products', (req, res)=>{
    collection.find({})
    .toArray((err, documents) =>{
      res.send(documents);
    })
  });

  app.get('/product/:id', (req, res)=>{
    collection.find({_id : ObjectId(req.params.id)})
    .toArray((err, documents) =>{
      res.send(documents[0]);
    })
  });




})

app.get('/', (req, res) => {
  res.send('Hello Shop Fresh Valley')
})

app.listen(port);