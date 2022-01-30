const express = require("express");
const { MongoClient } = require("mongodb");
const bodyParser = require("body-parser");
const cors = require("cors");
const ObjectId = require("mongodb").ObjectId;
const admin = require("firebase-admin");
require("dotenv").config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

const port = process.env.PORT || 5000;


var serviceAccount = require("./full-stack-assignment-10-firebase-adminsdk-ndxig-2341b2a6f7.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q0pfb.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const collection = client
    .db(`${process.env.DB_NAME}`)
    .collection(`${process.env.DB_CONNECT}`);

  const collectionBuyProducts = client
    .db(`${process.env.DB_NAME}`)
    .collection(`${process.env.DB_CONNECTED}`);

    const collectionOfAdmin = client
    .db(`${process.env.DB_NAME}`)
    .collection(`${process.env.DB_CONNECTED1}`);

  app.post("/addProducts", (req, res) => {
    const products = req.body;
    collection.insertOne(products).then((result) => {
      res.send(result.acknowledged === true);
    });
  });

  // add Admin
  app.post("/addAdmin", (req, res) => {
    const admin = req.body;
    collectionOfAdmin.insertOne(admin)
    .then((result) => {
      console.log(result)
      res.send(result.acknowledged === true)
    })
  });

  // load Admin Email
  app.post('/admin', (req, res) => {
    collectionOfAdmin.find({email : req.body.email})
    .toArray((err, admin) => {
      res.send(admin.length > 0)
    })
  });

  // user Add product
  app.post("/addBuy", (req, res) => {
    const buyProduct = req.body;
    collectionBuyProducts.insertOne(buyProduct).then((result) => {
      res.send(result.acknowledged === true);
    });
  });
  // added status as Admin
  app.patch('/update/:id', (req, res)=>{
    const status = req.body.status;
    const id = req.params.id;
    collectionBuyProducts.findOne({_id : ObjectId(id)}).then((result) => {
      if(result){
        const newProductInfo ={
          productName: result.newProduct.productName,
          weight: result.newProduct.weight,
          price: result.newProduct.price,
          status: status,
          imageURL: result.newProduct.imageURL

        };
        collectionBuyProducts.updateOne({_id: ObjectId(id)},{
          $set: {newProduct : newProductInfo}
        },{ upsert: true})
        .then((result) => {
          res.send(result.acknowledged === true);
        })
      }
    });

  })
  // load All users buy product
  app.get("/buyProducts", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];

      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail === queryEmail) {
            collectionBuyProducts
              .find({ email: req.query.email })
              .toArray((err, documents) => {
                res.send(documents);
              });
          }
        })
        .catch((error) => {
          res.status(401).send(alert("UnAuthorized user"));
        });
    } else {
      res.status(401).send(alert("UnAuthorized user"));
    }
  });

  // load all products
  app.get("/products", (req, res) => {
    const search = req.query.search;
    collection.find({productName : {$regex : search}})
    .toArray((err, documents) => {
      res.send(documents);
    });
  });

  // delete product as an admin
  app.delete('/delete/:id', (req, res) => {
    collectionBuyProducts.deleteOne({_id : ObjectId(req.params.id)})
    .then(results => {
      res.send(results.deletedCount > 0);
    })
  })

  // admin panel show user buy products
  app.get('/allBuyProduct', (req, res) => {
    collectionBuyProducts.find({})
    .toArray((err, documents) => {
      res.send(documents);
    })
  })

  // load product in checkout panel
  app.get("/product/:id", (req, res) => {
    collection
      .find({ _id: ObjectId(req.params.id) })
      .toArray((err, documents) => {
        res.send(documents[0]);
      });
  });
});

app.get("/", (req, res) => {
  res.send("Hello Shop Fresh Valley");
});

app.listen(port);
