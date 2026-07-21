let segundos = 0;
let intervalo = null;

let golesLocal = 0;
let golesVisitante = 0;

function mostrarTiempo() {
    const minutos = Math.floor(segundos / 60);
    const seg = segundos % 60;

    document.getElementById("cronometro").textContent =
        String(minutos).padStart(2, "0") + ":" +
        String(seg).padStart(2, "0");
}

function iniciarPartido() {
    if (intervalo !== null) return;

    intervalo = setInterval(() => {
        segundos++;
        mostrarTiempo();
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

    mostrarTiempo();

    document.getElementById("local").textContent = "0";
    document.getElementById("visitante").textContent = "0";
}

function golLocal() {
    golesLocal++;
    document.getElementById("local").textContent = golesLocal;
}

function golVisitante() {
    golesVisitante++;
    document.getElementById("visitante").textContent = golesVisitante;
}

// Mostrar 00:00 al cargar
mostrarTiempo();
// ===========================
// JUGADORAS MOVIBLES
// ===========================

const jugadoras = document.querySelectorAll(".jugadora");

jugadoras.forEach((jugadora) => {

    jugadora.style.cursor = "grab";

    let moviendo = false;
    let offsetX = 0;
    let offsetY = 0;

    jugadora.addEventListener("mousedown", (e) => {

        moviendo = true;

        const rect = jugadora.getBoundingClientRect();

        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        jugadora.style.cursor = "grabbing";

    });

    document.addEventListener("mousemove", (e) => {

        if (!moviendo) return;

        const campo = document.querySelector(".campo");
        const rectCampo = campo.getBoundingClientRect();

        let x = e.clientX - rectCampo.left - offsetX;
        let y = e.clientY - rectCampo.top - offsetY;

        jugadora.style.left = x + "px";
        jugadora.style.top = y + "px";

    });

    document.addEventListener("mouseup", () => {

        moviendo = false;
        jugadora.style.cursor = "grab";

    });

});