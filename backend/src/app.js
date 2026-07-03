import express from "express" ;
import authRoutes from "./modules/auth/auth.routes.js"
import paymentRoutes from "./modules/fee/routes/payment.routes.js";
import studentRoutes from "./modules/student/student.routes.js"
import userManagementRoutes from "./modules/user-management/user.routes.js"
import enquiryRoutes from "./modules/enquiry/enquiry.routes.js"




const app = express() ;

app.use( express.json() ) ; // global middeware
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth" , authRoutes ) ;
app.use("/api/students" , studentRoutes) ;
app.use("/api/user-management" , userManagementRoutes ) ;
app.use("/api/payments", paymentRoutes);
app.use("/api/enquiries", enquiryRoutes);



export default app ;