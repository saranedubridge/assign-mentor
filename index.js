require('dotenv').config();
const express = require('express');
const app=express();
const cors =require('cors');
const mongoose=require('mongoose');
const ObjectId=require('mongodb').ObjectId

// middleware
app.use(cors());
app.use(express.json());

// mongoose Atles url with .env 
const url=process.env.ATLAS_URI;
console.log(url);

// mongoose database connection
mongoose.connect(url)
.then(()=>{
    console.log('connected to Mongodb')

})
.catch((err)=>{
    console.error(err);
});

// define a schema
// schmea for a mentor
const mentorSchema =new mongoose.Schema({
    name:String,
    Email:String,
    phone:String,
    Students:[{type:mongoose.Schema.Types.ObjectId}]
})
// schema for a student
const studentSchema = new mongoose.Schema({
    name:String,
    email:String,
    phone:String,
    mentor:[{type:mongoose.Schema.Types.ObjectId}]
})

const Mentor = mongoose.model("Mentor",mentorSchema);
const Student=mongoose.model('Student',studentSchema);


// Api to create a new mentor

app.post('/api/mentors',async(request,response)=>{
    try{
        const{name,email}=request.body;
        const mentor=new Mentor({name,email});
        await mentor.save();
        response.status(201).json(mentor);
    }
    catch (error){
        response.status(500).json({error:error.message});
    }
});

// Api to create a new student 
app.post('/api/students',async(request,response)=>{
    try{
        const{name,email,mentorId}=request.body;
        const student = new Student({name,email,mentor:mentorId});
        await student.save();

        if (mentorId){
            const mentor = await Mentor.findById(mentorId);
            if(mentor){
                mentor.Students.push(student._id);
                await mentor.save();
            }
        }

        response.status(201).json(student);
    }catch(error){
        response.status(500).json({error:error.message})
    }
})

// Endpoint to Assign a student to a mentor

// app.post('/assign-student',(request,response)=>{
//     const{mentorId,studentId}=request.body;
//     Mentor.findById(new ObjectId(mentorId))
//     .then(mentor=>{
//         mentor.Students.push(new ObjectId(studentId));
//         mentor.save()
//         .then(()=>response.json('Student assigned!'))
//         .catch(error=>response.status(500).json({error:error.message}))
//     })
//     .catch(error=>response.status(500).json({error:error.message}))
// })

app.post('/assign-student', async (request, response) => {
    try {
        const { mentorId, studentId } = request.body;
        console.log('Mentor ID:', mentorId);
        console.log('Student ID:', studentId);

        const mentor = await Mentor.findById(new ObjectId(mentorId));
        if (!mentor) {
            return response.status(404).json({ error: 'Mentor Not Found' });
        }

        const student = await Student.findById(new ObjectId(studentId));
        if (!student) {
            return response.status(404).json({ error: 'Student Not Found' });
        }

        // Update student's mentorId
        student.mentor = new ObjectId(mentorId);
        await student.save();

        // Update mentor's students list
        mentor.Students.push(new ObjectId(studentId));
        await mentor.save();

        response.json('Student assigned!');
    } catch (error) {
        console.error(error);
        response.status(500).json({ error: error.message });
    }
});



// endpoint for assign or change mentor for a particular student 

app.put('/assign-mentor/:studentId',async (request,response)=>{
    console.log('Route handler reached!');
    try{
        const {studentId}=request.params;
    
        const{mentorId}=request.body;
        

        const student = await Student.findById(studentId);
        if(!student){
            return response.status(404).json({error:"Student Not found"});
        }

        // mentor property is initialized as an array
        if(!student.mentor){
            student.mentor=[]
    }
if(student.mentor.length>0){
    const previousMentorId = student.mentor[0];
    const previousMentor=await Mentor.findById(previousMentorId);
    if (previousMentor){
        previousMentor.Students=previousMentor.Students.filter(id=>id.toString()!==studentId);
        await previousMentor.save();
    }
}

student.mentor.push(new ObjectId(mentorId));
await student.save();

const mentor=await Mentor.findById(mentorId);
if(mentor){
    mentor.Students.push(new ObjectId(studentId));
    await mentor.save();
}
         response.json('Mentor assigned to student!');

    }catch(error){
        console.error(error)
        response.status(500).json({error:error.message});
    }
});




// Api to show all student for a particular mentor
app.get('/api/mentors/:mentorId/students',async(request,response)=>{
    try{
        const {mentorId}=request.params;
        const mentor=await Mentor.findById(mentorId).populate('Students');

        if(!mentor){
            return response.status(404).json({error:"Mentor Not Found"})
        }
        const students=mentor.Students;
        response.json(students);

    }catch(error){
        response.json(500).json({error:error.message})
    }
});




// Endpoint to show the previously assigned Mentor for a Particular Student
app.get('/api/students/:studentId/previous-mentor', async (request, response) => {
    try {
        const { studentId } = request.params;

        // Use 'previousMentor' as the path for the populated result
        const student = await Student.findById(studentId).populate({ path: 'mentor', select: '-students', model: 'Mentor', as: 'previousMentor' });

        if (!student) {
            return response.status(404).json({ error: 'Student Not Found' });
        }

        // Check if there's a previous mentor
        if (student.previousMentor) {
            // Return the previous mentor if it exists
            const previousMentor = student.previousMentor;
            response.json({ previousMentor, currentMentor: student.mentor });
        } else {
            // Return a message if no previous mentor is assigned
            response.json({ message: 'No previous mentor assigned.', currentMentor: student.mentor });
        }
    } catch (error) {
        response.status(500).json({ error: error.message });
    }
});


// listner to port
const PORT =3002;
app.listen(PORT,()=>{
    console.log(`Server is running on PORT${PORT}`)
})