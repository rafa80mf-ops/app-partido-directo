// ===================================
// APP PARTIDO DIRECTO v2.1
// Cronómetro + Marcador + Jugadoras
// ===================================

let segundos = 0;
let intervalo = null;

let golesLocal = 0;
let golesVisitante = 0;

// --------------------
// CRONÓMETRO
// --------------------

function actualizarCronometro() {

    const minutos = Math.floor(segundos / 60);
    const seg = segundos % 60;

    document.getElementById("cronometro").textContent =
        String(minutos).padStart(2,"0") + ":" +
        String(seg).padStart(2,"0");

}

function iniciarPartido(){

    if(intervalo) return;

    intervalo = setInterval(()=>{

        segundos++;
        actualizarCronometro();

    },1000);

}

function pausarPartido(){

    clearInterval(intervalo);
    intervalo = null;

}
function reiniciarPartido() {

    pausarPartido();

    segundos = 0;

    actualizarCronometro();

}
// --------------------
// GOLES
// --------------------

function golLocal(){

    golesLocal++;

    document.getElementById("local").textContent = golesLocal;
    document.getElementById("statsLocal").textContent = golesLocal;

}

function golVisitante(){

    golesVisitante++;

    document.getElementById("visitante").textContent = golesVisitante;
    document.getElementById("statsVisitante").textContent = golesVisitante;

}

actualizarCronometro();

// ===================================
// CONTINÚA EN LA PARTE 2
// ===================================
// ===================================
// JUGADORAS MOVIBLES
// ===================================

const jugadoras = document.querySelectorAll(".jugadora");

jugadoras.forEach((jugadora) => {

    let arrastrando = false;
    let offsetX = 0;
    let offsetY = 0;

    jugadora.addEventListener("mousedown", (e) => {

        arrastrando = true;

        const rect = jugadora.getBoundingClientRect();

        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        jugadora.style.zIndex = "1000";

    });

    document.addEventListener("mousemove", (e) => {

        if (!arrastrando) return;

        const campo = document.querySelector(".campo");

        if (!campo) return;

        const rectCampo = campo.getBoundingClientRect();

        let x = e.clientX - rectCampo.left - offsetX;
        let y = e.clientY - rectCampo.top - offsetY;

        if (x < 0) x = 0;
        if (y < 0) y = 0;

        if (x > rectCampo.width - jugadora.offsetWidth)
            x = rectCampo.width - jugadora.offsetWidth;

        if (y > rectCampo.height - jugadora.offsetHeight)
            y = rectCampo.height - jugadora.offsetHeight;

        jugadora.style.left = x + "px";
        jugadora.style.top = y + "px";

    });

    document.addEventListener("mouseup", () => {

        arrastrando = false;
        jugadora.style.zIndex = "1";

    });

});

// ===================================
// INICIO
// ===================================

actualizarCronometro();
// ==========================================
// EDITAR JUGADORAS
// ==========================================

let jugadoraSeleccionada = null;

document.querySelectorAll(".jugadora").forEach(jugadora => {

    jugadora.addEventListener("click", () => {

        jugadoraSeleccionada = jugadora;

        document.getElementById("numeroJugadora").value =
            jugadora.innerText.split("\n")[0];

        document.getElementById("nombreJugadora").value =
            jugadora.dataset.nombre || "";

        document.getElementById("modalJugadora").style.display = "flex";

    });

});

function guardarJugadora(){

    if(!jugadoraSeleccionada) return;

    const numero =
        document.getElementById("numeroJugadora").value;

    const nombre =
        document.getElementById("nombreJugadora").value;

    jugadoraSeleccionada.dataset.nombre = nombre;

    jugadoraSeleccionada.innerHTML =
        numero + "<br><small>" + nombre + "</small>";

    cerrarModal();

}

function cerrarModal(){

    document.getElementById("modalJugadora").style.display = "none";

}