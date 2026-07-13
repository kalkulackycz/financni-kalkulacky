window.addEventListener("DOMContentLoaded", function () {

const CONFIG = {

    SLEVA_POPLATNIK: 2570,

    INVALIDITA: {
        1: 210,
        2: 210,
        3: 420
    },

    SLEVA_ZTP: 1345,

    PRUMERNA_MZDA: 48967,

    get LIMIT_DAN_23_MESIC() {
        return Math.floor((this.PRUMERNA_MZDA * 3) / 100) * 100;
    },

    MIN_PRIJEM_ROCNI_BONUS: 134400,

    MAX_DANOVY_BONUS_MESIC: 5025,


    DETI_SAZBY: {
        1:1267,
        2:1860,
        3:2320
    }

};



const hrubaInput = document.getElementById("hrubaMzda");
const slider = document.getElementById("hrubaMzda-slider");

const tlacitko = document.getElementById("vypocitatMzdu");

const vysledek = document.getElementById("vysledekMzda");
const detaily = document.getElementById("detailyMzda");

const graf = document.getElementById("grafMzda");

const pocetDeti = document.getElementById("pocetDeti");
const ztpBox = document.getElementById("kontejner-ztp-deti");

let mujGraf = null;



function cislo(v){

    return Number(
        String(v)
        .replace(/\s/g,"")
        .replace(/\u00A0/g,"")
    ) || 0;

}




function format(v){

    return Math.round(v)
    .toLocaleString("cs-CZ");

}




function generujZTP(){

    if(!ztpBox) return;


    let pocet = Number(pocetDeti.value);


    ztpBox.innerHTML="";


    for(let i=1;i<=pocet;i++){

        ztpBox.innerHTML += `

        <label>

        <input 
        type="checkbox"
        class="ztp-dite"
        value="${i}">

        Dítě ${i} ZTP/P

        </label>

        `;

    }

}




function vypocitej(){


let hruba = cislo(hrubaInput.value);



if(hruba<=0)
return;



let deti = Number(pocetDeti.value)||0;



let ztpDeti =
[
...document.querySelectorAll(".ztp-dite:checked")
]
.map(x=>Number(x.value));



let poplatnik =
document.getElementById("slevaPoplatnik").checked;



let invalidita =
Number(document.getElementById("invalidita").value);



let ztp =
document.getElementById("ztpP").checked;





// odvody

let socialni =
Math.ceil(hruba*0.071);


let zdravotni =
Math.ceil(hruba*0.045);





// daň

let zaklad =
Math.floor(hruba/100)*100;


let dan;


if(zaklad > CONFIG.LIMIT_DAN_23_MESIC){

dan =
Math.ceil(CONFIG.LIMIT_DAN_23_MESIC*0.15)
+
Math.ceil(
(zaklad-CONFIG.LIMIT_DAN_23_MESIC)*0.23
);

}else{


dan =
Math.ceil(zaklad*0.15);


}





// slevy

let slevy = 0;


if(poplatnik)
slevy += CONFIG.SLEVA_POPLATNIK;


if(CONFIG.INVALIDITA[invalidita])
slevy += CONFIG.INVALIDITA[invalidita];


if(ztp)
slevy += CONFIG.SLEVA_ZTP;





let danPoSleve = Math.max(
0,
dan-slevy
);





// děti

let slevaDeti=0;


for(let i=1;i<=deti;i++){

let castka =
CONFIG.DETI_SAZBY[Math.min(i,3)];


if(ztpDeti.includes(i))
castka*=2;


slevaDeti+=castka;

}





let danPoDetech =
danPoSleve-slevaDeti;



let bonus=0;


let danKPlaceni;



if(danPoDetech<0){


bonus=Math.min(
Math.abs(danPoDetech),
CONFIG.MAX_DANOVY_BONUS_MESIC
);


if(hruba*12 < CONFIG.MIN_PRIJEM_ROCNI_BONUS){

bonus=0;

}



danKPlaceni=0;


}else{


danKPlaceni=danPoDetech;


}







let cista =

hruba

-socialni

-zdravotni

-danKPlaceni

+bonus;







vysledek.textContent =

"Čistý měsíční příjem: "
+
format(cista)
+
" Kč";





detaily.innerHTML = `


<p>
Hrubá mzda:
<strong>${format(hruba)} Kč</strong>
</p>


<p>
Sociální pojištění:
<strong>-${format(socialni)} Kč</strong>
</p>


<p>
Zdravotní pojištění:
<strong>-${format(zdravotni)} Kč</strong>
</p>


<p>
Daň před slevami:
<strong>${format(dan)} Kč</strong>
</p>


<p>
Slevy na dani:
<strong>-${format(slevy)} Kč</strong>
</p>


<p>
Daňové zvýhodnění děti:
<strong>-${format(slevaDeti)} Kč</strong>
</p>


${bonus>0?

`
<p>
Daňový bonus:
<strong>+${format(bonus)} Kč</strong>
</p>
`

:""}



<p>
<b>
Čistá mzda:
${format(cista)} Kč
</b>
</p>


`;





if(window.Chart){


if(mujGraf)
mujGraf.destroy();


mujGraf=new Chart(
graf,
{

type:"doughnut",


data:{


labels:[

"Čistá mzda",

"Sociální",

"Zdravotní",

"Daň"

],


datasets:[{

data:[

cista,

socialni,

zdravotni,

danKPlaceni

]


}]


},



options:{


responsive:true,


plugins:{


legend:{


position:"bottom"

}


}


}


}

);



}





}






// LISTENERY


tlacitko.addEventListener(
"click",
vypocitej
);



slider.addEventListener(
"input",
function(){

hrubaInput.value =
format(this.value);

vypocitej();

}

);



hrubaInput.addEventListener(
"input",
function(){

let v=cislo(this.value);


if(v)
slider.value=v;


}
);



hrubaInput.addEventListener(
"blur",
function(){

this.value=format(cislo(this.value));

vypocitej();

}
);




pocetDeti.addEventListener(
"change",
function(){

generujZTP();

vypocitej();

}
);



document
.querySelectorAll(
"#slevaPoplatnik,#invalidita,#ztpP"
)
.forEach(
e=>e.addEventListener(
"change",
vypocitej
)
);




generujZTP();

vypocitej();



});