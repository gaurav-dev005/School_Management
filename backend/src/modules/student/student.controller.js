
import Student from "./student.model.js"
import User from "../../models/user.model.js"
import { getStudentFees } from "../fee/services/fee.service.js";


import { getMyProfile , updateMyProfile } from "./student.service.js";

const getMyProfileController = async (req , res) => {
    try {

        const student = await getMyProfile(req.user.id);

        res.status(200).json({
            success: true,
            data: student
        });

    } catch (err) {
        res.status(404).json({
            success: false,
            message: err.message
        });
    }
};


const updateMyProfileController = async (req, res) => {
    try {
           console.log("1. PATCH controller reached");
        console.log("2. req.user:", req.user);
        console.log("3. req.body:", req.body);

        const student = await updateMyProfile(
            req.user.id,
            req.body
        );
          console.log("4. service completed");
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: student
        });

    } catch (err) {
         console.log("PATCH ERROR:", err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};





const getMyFees = async (req, res) => {
    try {

        const student = await Student.findOne({ userId: req.user.id });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const fees = await getStudentFees(student._id);

        return res.status(200).json({
            success: true,
            data: fees
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};



export  {
       getMyProfileController ,
       updateMyProfileController ,
       getMyFees
}





