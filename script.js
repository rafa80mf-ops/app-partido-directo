// ================================
// APP PARTIDO DIRECTO - Versión 2.0
// ================================

let segundos = 0;
let intervalo = null;

let golesLocal = 0;
let golesVisitante = 0;

// ---------- CRONÓMETRO ----------

function actualizarCronometro() {

    const minutos = Math.floor(segundos / 60);
    const seg = segundos % 60;

    document.getElementById("cronometro").textContent =
        String(minutos).padStart(2, "0") +
        ":" +
        String(seg).padStart(2, "0");
}

function iniciarPartido() {

    if (intervalo) return;

    intervalo = setInterval(() => {

        segundos++;
        actualizarCronometro();

    }, 1000);

}

function pausarPartido() {

    clearInterval(intervalo);
    intervalo = null;

}

function reiniciarPartido() {

    pausarPartido();

    segundos = 0;
    golesLocal = 0;
    golesVisitante = 0;

    actualizarCronometro();

    document.getElementById("local").textContent = golesLocal;
    document.getElementById("visitante").textContent = golesVisitante;

    document.getElementById("statsLocal").textContent = golesLocal;
    document.getElementById("statsVisitante").textContent = golesVisitante;

}

// ---------- GOLES ----------

function golLocal() {

    golesLocal++;

    document.getElementById("local").textContent = golesLocal;
    document.getElementById("statsLocal").textContent = golesLocal;

}

function golVisitante() {

    golesVisitante++;

    document.getElementById("visitante").textContent = golesVisitante;
    document.getElementById("statsVisitante").textContent = golesVisitante;

}

// ---------- INICIO ----------

actualizarCronometro();