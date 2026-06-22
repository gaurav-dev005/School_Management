import dotenv from "dotenv"
import app from "./app.js"
import connectDB from "./config/db.js"

dotenv.config() ;

const PORT = process.env.PORT || 3001


const startServer = async()=>{
              try{
                      await connectDB() ;

                      app.listen( PORT , ()=>{
                                     console.log(`Server running on PORT : ${PORT} `) ;
                      }) ;
              }
              catch(err){
                     console.error( err.message ) ;
                     process.exit(1) ;
              }
              
} 

startServer() ;