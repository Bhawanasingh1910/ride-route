const express=require("express");
const cors=require("cors");
const fs=require("fs");
const path=require("path");

const app=express();
const PORT=3000;

const DATA_DIR=path.join(__dirname,"data");
const VEHICLES_FILE=path.join(DATA_DIR,"vehicles.json");
const BOOKINGS_FILE=path.join(DATA_DIR,"bookings.json");

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function readJSON(file){
    try{
        return JSON.parse(fs.readFileSync(file,"utf8"));
    }catch(error){
        return [];
    }
}

function writeJSON(file,data){
    fs.writeFileSync(file,JSON.stringify(data,null,2));
}

function generateId(){
    return Date.now().toString();
}

app.get("/api/health",(req,res)=>{
    res.json({
        success:true,
        message:"Ride Route API is running"
    });
});

app.get("/api/vehicles",(req,res)=>{
    const vehicles=readJSON(VEHICLES_FILE);

    res.json({
        success:true,
        count:vehicles.length,
        data:vehicles
    });
});

app.get("/api/vehicles/:id",(req,res)=>{
    const vehicles=readJSON(VEHICLES_FILE);
    const vehicle=vehicles.find(v=>v.id===Number(req.params.id));

    if(!vehicle){
        return res.status(404).json({
            success:false,
            message:"Vehicle not found"
        });
    }

    res.json({
        success:true,
        data:vehicle
    });
});

app.get("/api/bookings",(req,res)=>{
    const bookings=readJSON(BOOKINGS_FILE);

    res.json({
        success:true,
        count:bookings.length,
        data:bookings
    });
});

app.post("/api/bookings",(req,res)=>{
    const {name,email,vehicleId,date}=req.body;

    if(!name||!email||!vehicleId||!date){
        return res.status(400).json({
            success:false,
            message:"Name, email, vehicle and date are required"
        });
    }

    const cleanName=name.trim();
    const cleanEmail=email.trim().toLowerCase();

    if(cleanName.length<2){
        return res.status(400).json({
            success:false,
            message:"Name must contain at least 2 characters"
        });
    }

    const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(!emailPattern.test(cleanEmail)){
        return res.status(400).json({
            success:false,
            message:"Please enter a valid email address"
        });
    }

    const selectedDate=new Date(date);
    const today=new Date();

    today.setHours(0,0,0,0);
    selectedDate.setHours(0,0,0,0);

    if(isNaN(selectedDate.getTime())){
        return res.status(400).json({
            success:false,
            message:"Invalid booking date"
        });
    }

    if(selectedDate<today){
        return res.status(400).json({
            success:false,
            message:"Booking date cannot be in the past"
        });
    }

    const vehicles=readJSON(VEHICLES_FILE);
    const vehicle=vehicles.find(v=>v.id===Number(vehicleId));

    if(!vehicle){
        return res.status(404).json({
            success:false,
            message:"Selected vehicle does not exist"
        });
    }

    if(!vehicle.available){
        return res.status(400).json({
            success:false,
            message:"This vehicle is currently unavailable"
        });
    }

    const bookings=readJSON(BOOKINGS_FILE);

    const alreadyBooked=bookings.some(
        booking =>
            booking.vehicleId===Number(vehicleId) &&
            booking.date===date &&
            booking.status==="confirmed"
    );

    if(alreadyBooked){
        return res.status(409).json({
            success:false,
            message:"This vehicle is already booked for the selected date"
        });
    }

    const booking={
        id:generateId(),
        name:cleanName,
        email:cleanEmail,
        vehicleId:Number(vehicleId),
        vehicleName:vehicle.name,
        date,
        status:"confirmed",
        createdAt:new Date().toISOString()
    };

    bookings.push(booking);
    writeJSON(BOOKINGS_FILE,bookings);

    res.status(201).json({
        success:true,
        message:"Test drive booked successfully",
        data:booking
    });
});

app.delete("/api/bookings/:id",(req,res)=>{
    const bookings=readJSON(BOOKINGS_FILE);

    const index=bookings.findIndex(
        booking=>booking.id===req.params.id
    );

    if(index===-1){
        return res.status(404).json({
            success:false,
            message:"Booking not found"
        });
    }

    bookings.splice(index,1);
    writeJSON(BOOKINGS_FILE,bookings);

    res.json({
        success:true,
        message:"Booking cancelled successfully"
    });
});

app.use((req,res)=>{
    res.status(404).json({
        success:false,
        message:"Route not found"
    });
});

app.listen(PORT,()=>{
    console.log(`Ride Route server running at http://localhost:${PORT}`);
});