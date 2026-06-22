import jwt from "jsonwebtoken" ;


export const protect = ( req , res , next )=>{
             let token ;

             const authHeader = req.headers.authorization ;

             if( authHeader && authHeader.startsWith("Bearer") ){
                    token = authHeader.split(" ")[1] ;
             }

             if( !token ){
                      return res.status(401).json({
                             message : " Not authorized , token does not exist "
                      }) ;
             }


             try{
                    const decoded = jwt.verify( token , process.env.JWT_SECRET ) ;

                    req.user = decoded ;
                    next() ;
             }
             catch(err){
                       return res.status(401).json({
                               message : " Not authorized , invalid access , token expired"
                       });  


             }
} ;


