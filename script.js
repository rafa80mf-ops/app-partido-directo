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