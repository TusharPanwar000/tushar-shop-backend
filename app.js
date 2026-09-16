const Product = require('./Product')
const cors = require('cors')
const {asyncHandler} = require('./utils/asyncHandler.js')


require ('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./User')
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());


app.post('/login', async (req, res) => {
  const user = await User.findOne({username: req.body.username})

  if(!user){
    return res.status(404).send('User nahi mila');
  }

  const isMatch = await bcrypt.compare(req.body.password, user.password);

  if(!isMatch){
    return res.status(404).send('Galat password')
  }

  const token = jwt.sign(
    {userId: user._id, username: user.username},
    process.env.JWT_SECRET, 
    {expiresIn: '1h'}
  );

  res.json({massege: 'Login successful!', token: token})
});



function verifyToken(req, res, next){
  console.log('All Header', req.headers)
  const token = req.headers['authorization'];
  console.log('Recevied Token', token)

  if(!token){
    return res.status(401).send('Token nahii mila')
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if(err){
      console.log('JWT Error', err.message)
      return res.status(403).send('token invalid hai');
        };

        req.user = decoded;
        next();
  })
};

app.post('/products', verifyToken, asyncHandler(async (req, res) => {

     const newProduct = new Product({
     name: req.body.name,
     price: req.body.price
  });

  await newProduct.save();
  res.status(201).json(newProduct)
 
 
}));

app.get('/products/:id', verifyToken, asyncHandler(async (req, res) => {
  
 
    const product = await Product.findById(req.params.id);
    if (!product) {
    return res.status(404).send('Product nahi mila');
  }
  res.json(product);



}));

app.get('/products', verifyToken, asyncHandler(async (req, res) => {
  
    const products = await Product.find();
    res.json(products);
  }
 
));


app.put('/products/:id', verifyToken, asyncHandler(async (req, res) => {
  
       const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id, 
      { name: req.body.name, price: req.body.price},
      {new: true}
    );
    
  if(!updatedProduct){
    return res.status(404).send('Product nahii mila');
  }

  res.json(updatedProduct)

 
 
}));


app.delete('/products/:id', verifyToken, asyncHandler(async(req, res) => {

  
    const deletedProduct = await Product.findByIdAndDelete(req.params.id)

  if(!deletedProduct){
    return res.status(404).send('Product nahii mila')
  }

  res.json({message: 'Product delete ho gya', deletedProduct})


 
}))
  



app.get('/profile', verifyToken, (req, res) => {
  res.json({message: 'Ye protected route hao', user: req.user});
})

app.post('/signup', asyncHandler(async (req, res) => {

  
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const newUser = new User({
    username: req.body.username,
    password: hashedPassword
  });

  await newUser.save();
  res.status(201).json({message: 'User succesfully done'})
  
  
}));



mongoose.connect(process.env.MONGO_URl)
.then(() => console.log('Server connect hogya hai'))
.catch((err) => console.log('Connection error:', err));


app.listen(3000, () => {
  console.log('Server chal raaha hai https://localhost:3000 pr ')
})




