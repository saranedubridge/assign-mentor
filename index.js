const express = require('express');
const app=express();
const cors =require('cors')
const mongoose=require('mongoose')

// middleware
app.use(cors());
app.use(express.json());