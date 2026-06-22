import express from "express" ;
import authRoutes from "./modules/auth/auth.routes.js"



const app = express() ;

app.use( expres.json() ) ; // global middeware


app.use("api/auth" , authRoutes ) ;



export default app ;