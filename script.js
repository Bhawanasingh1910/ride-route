const API="http://localhost:3000/api";

const menuOpenButton=document.querySelector("#menu-open-button");
const menuCloseButton=document.querySelector("#menu-close-button");

if(menuOpenButton){
    menuOpenButton.addEventListener("click",()=>{
        document.body.classList.toggle("show-mobile-menu");
    });
}

if(menuCloseButton){
    menuCloseButton.addEventListener("click",()=>{
        document.body.classList.remove("show-mobile-menu");
    });
}

const swiper=new Swiper(".slider-wrapper",{
    loop:true,
    grabCursor:true,
    spaceBetween:25,
    pagination:{
        el:".swiper-pagination",
        clickable:true,
        dynamicBullets:true
    },
    navigation:{
        nextEl:".swiper-button-next",
        prevEl:".swiper-button-prev"
    },
    breakpoints:{
        0:{
            slidesPerView:1
        },
        768:{
            slidesPerView:2
        },
        1024:{
            slidesPerView:3
        }
    }
});

async function loadVehicles(){
    const inventory=document.querySelector(".inventory-list");

    if(!inventory)return;

    try{
        const response=await fetch(`${API}/vehicles`);
        const result=await response.json();

        if(!result.success){
            throw new Error("Unable to load vehicles");
        }

        inventory.innerHTML="";

        result.data.forEach(vehicle=>{
            const item=document.createElement("li");

            item.className="inventory-item";

            item.innerHTML=`
                <img src="${vehicle.image}" alt="${vehicle.name}" class="inventory-image">

                <h3 class="name">${vehicle.name}</h3>

                <p class="text">${vehicle.price}</p>

                <p class="text">Color: ${vehicle.color}</p>

                <p class="text">${vehicle.mileage}</p>

                <p class="text">
                    Status:
                    <strong>${vehicle.available?"Available":"Unavailable"}</strong>
                </p>

                <button 
                    class="button book-vehicle"
                    data-id="${vehicle.id}">
                    Book Test Drive
                </button>
            `;

            inventory.appendChild(item);
        });

        document.querySelectorAll(".book-vehicle").forEach(button=>{
            button.addEventListener("click",()=>{
                const vehicleId=button.dataset.id;

                const vehicle=result.data.find(
                    vehicle=>vehicle.id===Number(vehicleId)
                );

                openBookingForm(vehicle);
            });
        });

    }catch(error){
        console.error(error);

        inventory.innerHTML=`
            <li class="inventory-item">
                <h3 class="name">Backend unavailable</h3>
                <p class="text">Start the Node.js server and refresh the page.</p>
            </li>
        `;
    }
}

function openBookingForm(vehicle){
    const form=document.querySelector(".contact-form");

    if(!form)return;

    form.innerHTML=`
        <h3 style="color:white;margin-bottom:20px;">
            Book Test Drive
        </h3>

        <p style="color:#00F5D4;margin-bottom:20px;">
            ${vehicle.name}
        </p>

        <input
            type="text"
            id="booking-name"
            placeholder="Your name"
            class="form-input"
            required
        >

        <input
            type="email"
            id="booking-email"
            placeholder="Your email"
            class="form-input"
            required
        >

        <input
            type="date"
            id="booking-date"
            class="form-input"
            required
        >

        <input
            type="hidden"
            id="booking-vehicle"
            value="${vehicle.id}"
        >

        <button type="submit" class="submit-button">
            Confirm Booking
        </button>

        <p id="booking-message" style="margin-top:15px;"></p>
    `;

    const dateInput=document.querySelector("#booking-date");

    const today=new Date();
    const year=today.getFullYear();
    const month=String(today.getMonth()+1).padStart(2,"0");
    const day=String(today.getDate()).padStart(2,"0");

    dateInput.min=`${year}-${month}-${day}`;

    form.onsubmit=submitBooking;

    document.querySelector("#contact").scrollIntoView({
        behavior:"smooth"
    });
}

async function submitBooking(event){
    event.preventDefault();

    const message=document.querySelector("#booking-message");

    const name=document.querySelector("#booking-name").value;
    const email=document.querySelector("#booking-email").value;
    const date=document.querySelector("#booking-date").value;
    const vehicleId=document.querySelector("#booking-vehicle").value;

    message.textContent="Booking...";

    try{
        const response=await fetch(`${API}/bookings`,{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                name,
                email,
                date,
                vehicleId
            })
        });

        const result=await response.json();

        if(!response.ok){
            throw new Error(result.message);
        }

        message.innerHTML=`
            <span style="color:#00F5D4;">
                ✓ ${result.message}
                <br>
                Booking ID: ${result.data.id}
            </span>
        `;

        document.querySelector("#booking-name").value="";
        document.querySelector("#booking-email").value="";
        document.querySelector("#booking-date").value="";

    }catch(error){
        message.innerHTML=`
            <span style="color:#ff6b6b;">
                ${error.message}
            </span>
        `;
    }
}

document.addEventListener("DOMContentLoaded",()=>{
    loadVehicles();
});