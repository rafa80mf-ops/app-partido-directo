

//==================================================
// TU PARTIDO EN DIRECTO
// SCRIPT V4.2
// BLOQUE 1
// ESTADO Y REFERENCIAS
//==================================================

//==================================================
// VERSIÓN
//==================================================

const VERSION = "4.2";

const CLAVE_GUARDADO = "tu_partido_en_directo_guardado";

//==================================================
// CLAVE DEL PARTIDO ACTUAL
//==================================================

function obtenerClavePartidoActual(){

    if(partidoCalendarioActual){

        return (
            CLAVE_GUARDADO +
            "_" +
            partidoCalendarioActual.id
        );

    }

    return CLAVE_GUARDADO;

}

//==================================================
// CAMPO Y BALÓN
//==================================================

const campo = document.getElementById("campo");

const balon = document.getElementById("balon");

const banquillo = document.getElementById("banquillo");
 //==================================================
// JUGADORAS
//==================================================

const titulares =
  Array.from(
      document.querySelectorAll(
          "#campo .jugadora"
      )
  );

const suplentes =
  Array.from(
      document.querySelectorAll(
          ".banquillo .suplente"
      )
  );

const todasLasJugadoras =
  titulares.concat(suplentes);

//==================================================
// MARCADOR
// IMPORTANTE: EL HTML USA "local" Y "visitante"
//==================================================

const marcadorLocal =
  document.getElementById("marcadorLocal");

const marcadorVisitante =
  document.getElementById("marcadorVisitante");

//==================================================
// NOMBRES DE EQUIPOS
//==================================================

const nombreLocal =
  document.getElementById("nombreLocal");

const nombreVisitante =
  document.getElementById("nombreVisitante");

//==================================================
// CRONÓMETRO
//==================================================

const cronometro =
  document.getElementById("cronometro");

//==================================================
// PANELES
//==================================================

const listaEventos =
  document.getElementById("listaEventos");

const textoActa =
  document.getElementById("textoActa");

//==================================================
// MODAL EDITAR
//==================================================

const modalJugadora =
  document.getElementById("modalJugadora");

const numeroJugadora =
  document.getElementById("numeroJugadora");

const nombreJugadora =
  document.getElementById("nombreJugadora");

const btnGuardarJugadora =
  document.getElementById("btnGuardarJugadora");

const btnCancelarJugadora =
  document.getElementById("btnCancelarJugadora");

//==================================================
// MODAL ESTADÍSTICAS
//==================================================

const modalEstadisticas =
  document.getElementById("modalEstadisticas");

const statGoles =
  document.getElementById("statGoles");

const statAsistencias =
  document.getElementById("statAsistencias");

const statAmarillas =
  document.getElementById("statAmarillas");

const statRojas =
  document.getElementById("statRojas");

const btnCerrarEstadisticas =
  document.getElementById("btnCerrarEstadisticas");

//==================================================
// BOTONES PRINCIPALES
//==================================================

const btnInicio =
  document.getElementById("btnInicio");

const btnPausa =
  document.getElementById("btnPausa");

const btnReiniciar =
  document.getElementById("btnReiniciar");

const btnEditar =
  document.getElementById("btnEditar");

const btnGolLocal =
  document.getElementById("btnGolLocal");

const btnGolVisitante =
  document.getElementById("btnGolVisitante");

const btnCambio =
  document.getElementById("btnCambio");

const btnEventos =
  document.getElementById("btnEventos");

const btnActa =
  document.getElementById("btnActa");

const btnEquipo =
    document.getElementById("btnEquipo");  

const btnAplicarTitulares =
    document.getElementById("btnAplicarTitulares");

if(btnAplicarTitulares){

    btnAplicarTitulares.addEventListener(
        "click",
        aplicarEquipoTitular
    );

}

  const btnImprimirActa =
   document.getElementById("btnImprimirActa");

const btnCompartirActa =
   document.getElementById("btnCompartirActa");

const btnHistorial =
   document.getElementById("btnHistorial");  
 
const btnFinalizar =
   document.getElementById("btnFinalizar");

//==================================================
// CALENDARIO
//==================================================

const btnCalendario =
    document.getElementById("btnCalendario");

const menuCalendario =
    document.getElementById("menuCalendario");

const btnCalendarioLiga =
    document.getElementById("btnCalendarioLiga");

const btnCalendarioAmistosos =
    document.getElementById("btnCalendarioAmistosos");

//==================================================
// DESPLEGABLE CALENDARIO DE AMISTOSOS
//==================================================

const menuAmistosos =
    document.getElementById(
        "menuAmistosos"
    );

//==================================================
// PANELES
//==================================================

const panelEventos =
  document.getElementById("panelEventos");

const panelActa =
  document.getElementById("panelActa");

const panelEquipo =
    document.getElementById("panelEquipo");  

    const btnNuevaJugadora =
    document.getElementById("btnNuevaJugadora");

const btnGuardarEquipo =
    document.getElementById("btnGuardarEquipo");

const listaEquipo =
    document.getElementById("listaEquipo");

const panelHistorial =
   document.getElementById("panelHistorial");

const listaPartidos =
   document.getElementById("listaPartidos");

//==================================================
// BOTONES OPCIONALES
// SI TODAVÍA NO ESTÁN EN HTML, NO PASA NADA
//==================================================
const btnAmarilla =
  document.getElementById("btnAmarilla");

const btnRoja =
  document.getElementById("btnRoja");

const btnLesion =
  document.getElementById("btnLesion");

//==================================================
// PLANTILLA DEL EQUIPO
//==================================================

let plantillaEquipo = [];

const CLAVE_PLANTILLA =
    "plantilla_equipo";

//==================================================
// CARGAR PLANTILLA GUARDADA
//==================================================

const plantillaGuardada =
    localStorage.getItem(
        CLAVE_PLANTILLA
    );

if(plantillaGuardada){

    try{

        plantillaEquipo =
            JSON.parse(
                plantillaGuardada
            );

    }catch(error){

        plantillaEquipo = [];

    }

}    

//==================================================
// ESTADO DEL PARTIDO
//==================================================

let golesLocal = 0;

let golesVisitante = 0;

let segundos = 0;

let intervaloCronometro = null;

let estadoPartido = "detenido";

let parteActual = 1;

let historial = [];

let estadisticas = {};

//==================================================
// PARTIDO DEL CALENDARIO ACTUAL
//==================================================

let partidoCalendarioActual = null;
let idPartidoCalendarioEnJuego = null;

//==================================================
// MODOS
//==================================================

let modo = "normal";

let jugadoraSeleccionada = null;

let jugadoraCambioSalida = null;

let jugadoraCambioEntrada = null;

let cambioPorLesion = false;

//==================================================
// ARRASTRE
//==================================================

const drag = {

  activo: null,

  contenedor: null,

  offsetX: 0,

  offsetY: 0

};

//==================================================

console.log("SCRIPT V4.2 - BLOQUE 1 OK");
//==================================================
// ESTADÍSTICAS DE JUGADORAS
// BLOQUE 2
//==================================================

function obtenerEstadisticas(id){

  if(!estadisticas[id]){

      estadisticas[id]={

          goles:0,

          asistencias:0,

          amarillas:0,

          rojas:0,

          lesiones:0

      };

  }

  return estadisticas[id];

}

//==================================================
// MINUTO DEL PARTIDO
//==================================================

function obtenerMinuto(){

  const minutos =
      Math.floor(segundos / 60);

  const segundosRestantes =
      segundos % 60;

  return String(minutos) +

      ":" +

      String(segundosRestantes)

          .padStart(2,"0");

}

//==================================================
// FORMATEAR TIEMPO
//==================================================

function formatearTiempo(){

  const minutos =
      Math.floor(segundos / 60);

  const segundosRestantes =
      segundos % 60;

  return (

      String(minutos).padStart(2,"0") +

      ":" +

      String(segundosRestantes).padStart(2,"0")

  );

}

//==================================================
// ACTUALIZAR CRONÓMETRO
//==================================================

function actualizarCronometro(){

  if(!cronometro) return;

  cronometro.textContent =
      formatearTiempo();

}

//==================================================
// INICIALIZAR ESTADÍSTICAS
//==================================================

function inicializarEstadisticas(){

  todasLasJugadoras.forEach(function(jugadora){

      obtenerEstadisticas(jugadora.id);

  });

}

//==================================================
// NOMBRE DE JUGADORA
//==================================================

function obtenerNombreJugadora(jugadora){

  if(!jugadora) return "";

  const elemento =
      jugadora.querySelector(".nombre");

  if(!elemento) return "";

  return elemento.textContent.trim();

}

//==================================================
// DORSAL DE JUGADORA
//==================================================

function obtenerDorsalJugadora(jugadora){

  if(!jugadora) return "";

  const elemento =
      jugadora.querySelector(".dorsal");

  if(!elemento) return "";

  return elemento.textContent.trim();

}

//==================================================
// CLASE DE JUGADORA
//==================================================

function esTitular(jugadora){

  if(!jugadora) return false;

  return jugadora.classList.contains("jugadora");

}

function esSuplente(jugadora){

  if(!jugadora) return false;

  return jugadora.classList.contains("suplente");

}

//==================================================
// BUSCAR JUGADORA POR ID
//==================================================

function buscarJugadora(id){

  if(!id) return null;

  return document.getElementById(id);

}

//==================================================

inicializarEstadisticas();

actualizarCronometro();

console.log("SCRIPT V4.2 - BLOQUE 2 OK");
//==================================================
// CRONÓMETRO
// BLOQUE 3
//==================================================

//==================================================
// INICIAR CRONÓMETRO
//==================================================

function iniciarCronometro(){

  if(intervaloCronometro) return;

  estadoPartido="jugando";

  intervaloCronometro=setInterval(function(){

      segundos++;

      actualizarCronometro();

      guardarPartido();

  },1000);

}

//==================================================
// PAUSAR CRONÓMETRO
//==================================================

function pausarCronometro(){

  if(!intervaloCronometro) return;

  clearInterval(intervaloCronometro);

  intervaloCronometro=null;

  estadoPartido="pausa";

  guardarPartido();

}

//==================================================
// DETENER CRONÓMETRO
//==================================================

function detenerCronometro(){

  if(intervaloCronometro){

      clearInterval(intervaloCronometro);

      intervaloCronometro=null;

  }

  estadoPartido="detenido";

}

//==================================================
// REINICIAR CRONÓMETRO
//==================================================

function reiniciarCronometro(){

   detenerCronometro();

   segundos=0;

   golesLocal=0;

   golesVisitante=0;

   historial.length=0;

   //==================================================
   // LIMPIAR EVENTOS
   //==================================================

   if(listaEventos){

       listaEventos.innerHTML="";

   }

   //==================================================
   // LIMPIAR ACTA
   //==================================================

   if(textoActa){

       textoActa.textContent="";

   }

   //==================================================
   // CERRAR PANELES
   //==================================================

   if(panelEventos){

       panelEventos.classList.add(
           "oculto"
       );

   }

   if(panelActa){

       panelActa.classList.add(
           "oculto"
       );

   }

   //==================================================
   // NUEVO PARTIDO
   //==================================================

//==================================================
// REINICIAR ESTADÍSTICAS DEL PARTIDO
//==================================================

estadisticas = {};
   estadoPartido="detenido";

   modo="normal";

   actualizarMarcador();

   actualizarCronometro();

   guardarPartido();

}

//==================================================
// BOTÓN INICIAR
//==================================================

if(btnInicio){

  btnInicio.addEventListener(

      "click",

      iniciarCronometro

  );

}

//==================================================
// BOTÓN PAUSA
//==================================================

if(btnPausa){

  btnPausa.addEventListener(

      "click",

      pausarCronometro

  );

}

//==================================================
// BOTÓN REINICIAR
//==================================================

if(btnReiniciar){

   btnReiniciar.addEventListener(

       "click",

       function(){

           if(confirm(
               "¿Quieres reiniciar el partido?\n\nSe borrarán los eventos y el acta del partido actual."
           )){

               reiniciarCronometro();

           }

       }

   );

}

//==================================================
console.log("SCRIPT V4.2 - BLOQUE 3 OK");
//==================================================
// MARCADOR Y GOLES
// BLOQUE 4
//====
//==================================================
// ACTUALIZAR MARCADOR
//==================================================

function actualizarMarcador(){

  const marcadorLocalActual =
      document.getElementById("marcadorLocal");

  const marcadorVisitanteActual =
      document.getElementById("marcadorVisitante");

  if(marcadorLocalActual){

      marcadorLocalActual.textContent =
          String(golesLocal);

  }

  if(marcadorVisitanteActual){

      marcadorVisitanteActual.textContent =
          String(golesVisitante);

  }

}
//==================================================
// GOL LOCAL — EQUIPO
//==================================================

function sumarGolLocal(){

  golesLocal++;

  registrarEvento(
      "⚽ Gol del equipo local"
  );

  actualizarMarcador();

  actualizarHistorial();

  generarActa();

  guardarPartido();

}

//==================================================
// GOL VISITANTE — EQUIPO
//==================================================

function sumarGolVisitante(){

  golesVisitante++;

  registrarEvento(
      "⚽ Gol del equipo visitante"
  );

  actualizarMarcador();

  actualizarHistorial();

  generarActa();

  guardarPartido();

}

//==================================================
// GOL LOCAL — JUGADORA
//==================================================

function registrarGolJugadora(jugadora){

  if(!jugadora) return;

  const nombre =
      obtenerNombreJugadora(jugadora);

  const dorsal =
      obtenerDorsalJugadora(jugadora);

  const datos =
      obtenerEstadisticas(jugadora.id);

  datos.goles++;

  golesLocal++;

  const minuto =
      obtenerMinuto();

  registrarEvento(

      "⚽ Gol de " +
      nombre +
      " (" +
      dorsal +
      ") — " +
      minuto

  );

  actualizarMarcador();

  actualizarHistorial();

  generarActa();

  modo="normal";

  guardarPartido();

}

//==================================================
// RESTAR GOL LOCAL
//==================================================

function restarGolLocal(){

  if(golesLocal<=0) return;

  golesLocal--;

  actualizarMarcador();

  actualizarHistorial();

  generarActa();

  guardarPartido();

}

//==================================================
// RESTAR GOL VISITANTE
//==================================================

function restarGolVisitante(){

  if(golesVisitante<=0) return;

  golesVisitante--;

  actualizarMarcador();

  actualizarHistorial();

  generarActa();

  guardarPartido();

}

//==================================================
// REINICIAR MARCADOR
//==================================================

function reiniciarMarcador(){

  golesLocal=0;

  golesVisitante=0;

  actualizarMarcador();

  actualizarHistorial();

  generarActa();

  guardarPartido();

}

//==================================================
// BOTÓN GOL LOCAL
//==================================================

if(btnGolLocal){

  btnGolLocal.addEventListener(
      "click",
      function(){

          modo="golLocal";

          alert(
              "Selecciona la jugadora que ha marcado."
          );

      }
  );

}

//==================================================
// BOTÓN GOL VISITANTE
//==================================================

if(btnGolVisitante){

  btnGolVisitante.addEventListener(
      "click",
      function(){

          sumarGolVisitante();

      }
  );

}

//==================================================
// ACTUALIZAR MARCADOR
//==================================================

actualizarMarcador();

console.log(
  "SCRIPT V4.2 - BLOQUE 4 OK"
);

//==================================================
// EVENTOS, HISTORIAL Y ACTA
// BLOQUE 5
//==================================================

//==================================================
// REGISTRAR EVENTO
//==================================================

function registrarEvento(texto){

  historial.push({

      minuto: obtenerMinuto(),

      texto: texto,

      fecha: new Date().toLocaleString()

  });

}

//==================================================
// ACTUALIZAR HISTORIAL
//==================================================

function actualizarHistorial(){

  if(!listaEventos) return;

  listaEventos.innerHTML="";

  historial.forEach(function(evento){

      const linea =
          document.createElement("div");

      linea.className="evento";

      linea.textContent =

          evento.minuto +

          " — " +

          evento.texto;

      listaEventos.appendChild(linea);

  });

}

//==================================================
// GENERAR ACTA
//==================================================

function generarActa(){

   if(!textoActa) return;

   let texto="";

   //==================================================
   // CABECERA
   //==================================================

   texto +=
       "ACTA DEL PARTIDO\n\n";

   texto +=
       nombreLocal.value +

       "  " +

       golesLocal +

       " - " +

       golesVisitante +

       "  " +

       nombreVisitante.value +

       "\n\n";

   //==================================================
   // CLASIFICAR EVENTOS
   //==================================================

   const goles = [];
   const asistencias = [];
   const cambios = [];
   const lesiones = [];
   const amarillas = [];
   const rojas = [];

   historial.forEach(function(evento){

       const textoEvento =
           evento.texto.toLowerCase();

       if(textoEvento.includes("gol")){

           goles.push(evento);

       }

       else if(textoEvento.includes("asistencia")){

           asistencias.push(evento);

       }

       else if(textoEvento.includes("cambio")){

           cambios.push(evento);

       }

       else if(
           textoEvento.includes("lesión") ||
           textoEvento.includes("lesion")
       ){

           lesiones.push(evento);

       }

       else if(textoEvento.includes("amarilla")){

           amarillas.push(evento);

       }

       else if(textoEvento.includes("roja")){

           rojas.push(evento);

       }

   });

   //==================================================
   // AÑADIR BLOQUE
   //==================================================

   function añadirBloque(titulo, eventos){

       texto +=
           titulo + "\n";

       texto +=
           "====================\n\n";

       if(eventos.length === 0){

           texto +=
               "No hay eventos registrados.\n\n";

       }else{

           eventos.forEach(function(evento){

               texto +=
                   evento.minuto +
                   " — " +
                   evento.texto +
                   "\n";

           });

           texto += "\n";

       }

   }

   //==================================================
   // BLOQUES DEL ACTA
   //==================================================

   añadirBloque(
       "GOLES",
       goles
   );

   añadirBloque(
       "ASISTENCIAS",
       asistencias
   );

   añadirBloque(
       "CAMBIOS",
       cambios
   );

   añadirBloque(
       "LESIONES",
       lesiones
   );

   añadirBloque(
       "AMARILLAS",
       amarillas
   );

   añadirBloque(
       "ROJAS",
       rojas
   );

   //==================================================
   // FIN DEL ACTA
   //==================================================

   texto +=
       "====================\n";

   texto +=
       "FIN DEL ACTA\n";

   textoActa.textContent =
       texto;

}

//==================================================
// ACTUALIZAR TODA LA APLICACIÓN
//==================================================

function actualizarAplicacion(){

  actualizarMarcador();

  actualizarCronometro();

  actualizarHistorial();

  generarActa();

}
//==================================================
// GUARDAR PARTIDO FINALIZADO
//==================================================

function guardarPartidoFinalizado(){

   const partidosGuardados =
       JSON.parse(
           localStorage.getItem("partidosGuardados") || "[]"
       );


   const partido = {

       id: Date.now(),

       fecha:
           new Date().toLocaleString(),

       local:
           nombreLocal.value,

       visitante:
           nombreVisitante.value,

       golesLocal:
           golesLocal,

       golesVisitante:
           golesVisitante,

       eventos:
           historial,

       acta:
           textoActa.textContent

   };


   //==================================================
   // GUARDAR EN HISTORIAL
   //==================================================

   partidosGuardados.push(partido);

   localStorage.setItem(
       "partidosGuardados",
       JSON.stringify(partidosGuardados)
   );


   //==================================================
   // OBTENER ID DEL PARTIDO DEL CALENDARIO
   //==================================================

   if(partidoCalendarioActual){
    console.log(
    "PARTIDO CALENDARIO ACTUAL:",
    partidoCalendarioActual
);

console.log(
    "ID DEL PARTIDO:",
    partidoCalendarioActual.id
);

       const idPartido =
           partidoCalendarioActual.id;


       //==================================================
       // QUITAR DE LIGA
       //==================================================

       let partidosLiga =
           JSON.parse(
               localStorage.getItem("partidosLiga") || "[]"
           );


       partidosLiga =
           partidosLiga.filter(
               function(p){

                   return p.id !== idPartido;

               }
           );


       localStorage.setItem(
           "partidosLiga",
           JSON.stringify(partidosLiga)
       );


       //==================================================
       // QUITAR DE AMISTOSOS
       //==================================================

       let partidosAmistosos =
           JSON.parse(
               localStorage.getItem("partidosAmistosos") || "[]"
           );


       partidosAmistosos =
           partidosAmistosos.filter(
               function(p){

                   return p.id !== idPartido;

               }
           );


       localStorage.setItem(
           "partidosAmistosos",
           JSON.stringify(partidosAmistosos)
       );


       console.log(
           "PARTIDO RETIRADO DEL CALENDARIO. ID:",
           idPartido
       );


       //==================================================
       // ACTUALIZAR CALENDARIOS
       //==================================================

       mostrarCalendarioLiga();

       mostrarCalendarioAmistosos();


       //==================================================
       // LIMPIAR PARTIDO ACTUAL
       //==================================================

       partidoCalendarioActual = null;
       let idPartidoCalendarioEnJuego = null;

   }else{

       console.log(
           "NO HAY PARTIDO DE CALENDARIO SELECCIONADO"
       );

   }

}
//==================================================

console.log("SCRIPT V4.2 - BLOQUE 5 OK");
//==================================================
// SELECCIÓN DE JUGADORAS
// TARJETAS Y LESIONES
// BLOQUE 6
//==================================================
//==================================================
// SELECCIONAR JUGADORA
//==================================================

function seleccionarJugadora(){

  //==================================================
  // GOL LOCAL
  //==================================================

  if(modo==="golLocal"){

      registrarGolJugadora(this);

      return;

  }

  //==================================================
  // GOL VISITANTE
  //==================================================

  if(modo==="golVisitante"){

      registrarGolVisitante(this);

      return;

  }
//==================================================
  // CAMBIO
  //==================================================

  if(modo==="cambio"){

      seleccionarCambio(this);

      return;

  }

  //==================================================
  // TARJETA AMARILLA
  //==================================================

  if(modo==="amarilla"){

      registrarAmarilla(this);

      return;

  }

 //==================================================
// TARJETA ROJA
//==================================================

if(modo==="roja"){

  registrarRoja(this);

  return;

}

//==================================================
// ASISTENCIA
//==================================================

if(modo==="asistencia"){

  registrarAsistencia(this);

  return;

}

//==================================================
// LESIÓN
//==================================================

if(modo==="lesion"){

    registrarLesion(this);

    // Guardar la lesionada como jugadora que sale
    jugadoraCambioSalida = this;

    // Indicar que el cambio es por lesión
    cambioPorLesion = true;

    // Pasar directamente al modo cambio
    modo = "cambio";

    alert(
        "Selecciona una suplente para sustituir a la lesionada."
    );

    return;
}

}
//==================================================
// TARJETA AMARILLA
//==================================================

function registrarAmarilla(jugadora){

  if(!jugadora) return;

  const nombre =
      obtenerNombreJugadora(jugadora);

  const dorsal =
      obtenerDorsalJugadora(jugadora);

  const datos =
      obtenerEstadisticas(jugadora.id);

datos.amarillas++;
console.log(
    "AMARILLAS DE LA JUGADORA:",
    nombre,
    datos.amarillas
);
//==================================================
// SEGUNDA AMARILLA = EXPULSIÓN
//==================================================

if(datos.amarillas === 2){

    registrarRoja(jugadora);

    return;

}

//==================================================
// PRIMERA AMARILLA
//==================================================

if(datos.amarillas === 1){

    jugadora.classList.add(
        "tieneAmarilla"
    );

}
  registrarEvento(

      "🟨 Amarilla para " +

nombre +

  " (" +

      dorsal +

      ")"

  );

  modo="normal";

  actualizarAplicacion();

  guardarPartido();

}

//==================================================
// ASISTENCIA
//==================================================

function registrarAsistencia(jugadora){

  if(!jugadora) return;

  const nombre =
      obtenerNombreJugadora(jugadora);

  const dorsal =
      obtenerDorsalJugadora(jugadora);

  const datos =
      obtenerEstadisticas(jugadora.id);

  datos.asistencias++;

  registrarEvento(

      "🅰️ Asistencia de " +

      nombre +

      " (" +

      dorsal +

      ")"

  );

  modo="normal";

  actualizarAplicacion();

  guardarPartido();

}

//==================================================
// TARJETA ROJA
//==================================================

function registrarRoja(jugadora){

    if(!jugadora) return;

    const nombre =
        obtenerNombreJugadora(jugadora);

    const dorsal =
        obtenerDorsalJugadora(jugadora);

    const datos =
        obtenerEstadisticas(jugadora.id);

    datos.rojas++;

    registrarEvento(

        "🟥 Roja para " +

        nombre +

        " (" +

        dorsal +

        ")"

    );

    //==================================================
    // MOVER LA JUGADORA EXPULSADA AL BANQUILLO
    //==================================================

    if(banquillo){

        // Guardar posición que tenía en el campo
jugadora.dataset.posicionCampoLeft =
    jugadora.style.left;

jugadora.dataset.posicionCampoTop =
    jugadora.style.top;

        jugadora.className =
            "suplente jugadoraExpulsada";

        jugadora.style.position =
            "absolute";

        jugadora.style.left =
            "15%";

        const expulsadas =
            banquillo.querySelectorAll(
                ".jugadoraExpulsada"
            );

        jugadora.style.top =
            (10 + (expulsadas.length - 1) * 9) + "%";

        const nombreFicha =
            jugadora.querySelector(".nombre");

        if(nombreFicha){

            nombreFicha.textContent =
                "🟥 " +
                nombre +
                " EXPULSADA";

        }

        banquillo.appendChild(
            jugadora
        );

    }

    modo="normal";

    actualizarAplicacion();

    guardarPartido();

}

//==================================================
// LESIÓN
//==================================================

function registrarLesion(jugadora){

    if(!jugadora) return;

    const nombre =
        obtenerNombreJugadora(jugadora);

    const dorsal =
        obtenerDorsalJugadora(jugadora);

    const datos =
        obtenerEstadisticas(jugadora.id);

    datos.lesiones++;

    registrarEvento(

        "🩹 Lesión de " +

        nombre +

        " (" +

        dorsal +

        ")"

    );

    //==================================================
    // MOVER LA JUGADORA LESIONADA AL BANQUILLO
    //==================================================

    if(banquillo){

        jugadora.className =
            "suplente jugadoraLesionada";

        jugadora.style.position =
            "absolute";

        jugadora.style.left =
            "15%";

        const lesionadas =
            banquillo.querySelectorAll(
                ".jugadoraLesionada"
            );

        jugadora.style.top =
            (10 + (lesionadas.length - 1) * 9) + "%";

        const nombreFicha =
            jugadora.querySelector(".nombre");

        if(nombreFicha){

            nombreFicha.textContent =
                "🩹 " +
                nombre +
                " LESIONADA";

        }

        banquillo.appendChild(
            jugadora
        );

    }

    modo="normal";

    actualizarAplicacion();

    guardarPartido();

}
//==================================================
// BOTÓN AMARILLA
//==================================================

if(btnAmarilla){

  btnAmarilla.addEventListener(

      "click",

      function(){

          modo="amarilla";

          alert(
              "Selecciona la jugadora amonestada."
          );

      }

  );

}

//==================================================
// BOTÓN ROJA
//==================================================

if(btnRoja){

  btnRoja.addEventListener(

      "click",

      function(){

          modo="roja";

          alert(
              "Selecciona la jugadora expulsada."
          );

      }

  );

}

//==================================================
// BOTÓN ASISTENCIA
//==================================================

if(btnAsistencia){

  btnAsistencia.addEventListener(

      "click",

      function(){

          modo="asistencia";

          alert(
              "Selecciona la jugadora que ha dado la asistencia."
          );

      }

  );

}

//==================================================
// BOTÓN LESIÓN
//==================================================

if(btnLesion){

  btnLesion.addEventListener(

      "click",

      function(){

          modo="lesion";

          alert(
              "Selecciona la jugadora lesionada."
          );

      }

  );

}

//==================================================
// ACTIVAR EVENTOS DE LAS JUGADORAS
//==================================================

todasLasJugadoras.forEach(function(jugadora){

  jugadora.addEventListener(
      "click",
      seleccionarJugadora
  );

});

//==================================================

console.log("SCRIPT V4.2 - BLOQUE 6 OK");
//==================================================
// ARRASTRE Y POSICIONES
// BLOQUE 7
//==================================================

//==================================================
// INICIAR ARRASTRE
//==================================================

function iniciarArrastre(e){

  if(modo!=="normal") return;

  if(!this) return;

  drag.activo=this;

  // Cada jugadora se mueve dentro de su
  // contenedor real: campo o banquillo.

  if(this.classList.contains("suplente")){

      drag.contenedor=banquillo;

  }else{

      drag.contenedor=campo;

  }

  if(!drag.contenedor) return;

  const rect=
      this.getBoundingClientRect();

  drag.offsetX=
      e.clientX-rect.left;

  drag.offsetY=
      e.clientY-rect.top;

  this.style.position="absolute";

  this.style.cursor="grabbing";

  e.preventDefault();

}

//==================================================
// MOVER JUGADORA
//==================================================

function moverJugadora(e){

  if(!drag.activo) return;

  if(!drag.contenedor) return;

  const rect=
      drag.contenedor.getBoundingClientRect();

  let x=
      e.clientX-
      rect.left-
      drag.offsetX;

  let y=
      e.clientY-
      rect.top-
      drag.offsetY;

  const maxX=
      rect.width-
      drag.activo.offsetWidth;

  const maxY=
      rect.height-
      drag.activo.offsetHeight;

  x=Math.max(
      0,
      Math.min(x,maxX)
  );

  y=Math.max(
      0,
      Math.min(y,maxY)
  );

  drag.activo.style.left=
      x+"px";

  drag.activo.style.top=
      y+"px";

}

//==================================================
// SOLTAR JUGADORA
//==================================================

function soltarJugadora(){

  if(!drag.activo) return;

  drag.activo.style.cursor="grab";

  guardarPartido();

  drag.activo=null;

  drag.contenedor=null;

}

//==================================================
// EVENTOS DEL RATÓN
//==================================================

document.addEventListener(
  "mousemove",
  moverJugadora
);

document.addEventListener(
  "mouseup",
  soltarJugadora
);

//==================================================
// ACTIVAR ARRASTRE
//==================================================

todasLasJugadoras.forEach(function(jugadora){

  jugadora.removeEventListener(
      "mousedown",
      iniciarArrastre
  );

  jugadora.addEventListener(
      "mousedown",
      iniciarArrastre
  );

});

//==================================================
// RECOLOCAR TITULARES
//==================================================
function colocarTitulares(){

  if(!campo) return;

  const posiciones={

      // PORTERA
      j1:{
          left:"5%",
          top:"50%"
      },

      // DEFENSAS
      j2:{
          left:"20%",
          top:"20%"
      },

      j3:{
          left:"20%",
          top:"40%"
      },

      j4:{
          left:"20%",
          top:"60%"
      },

      j5:{
          left:"20%",
          top:"80%"
      },

      // CENTROCAMPISTAS
      j6:{
          left:"45%",
          top:"30%"
      },

      j7:{
          left:"45%",
          top:"50%"
      },

      j8:{
          left:"45%",
          top:"70%"
      },

      // DELANTERAS
      j9:{
          left:"70%",
          top:"35%"
      },

      j10:{
          left:"70%",
          top:"65%"
      },

      j11:{
          left:"85%",
          top:"50%"
      }

  };

  campo
      .querySelectorAll(".jugadora")
      .forEach(function(jugadora){

          const posicion =
              posiciones[jugadora.id];

          if(!posicion) return;

          jugadora.style.position =
              "absolute";

          jugadora.style.left =
              posicion.left;

          jugadora.style.top =
              posicion.top;

      });

}

//==================================================
// APLICAR EQUIPO TITULAR
//==================================================

function aplicarEquipoTitular(){

    const seleccionadas =
    document.querySelectorAll(
        ".seleccionarTitular:checked"
    );

if(seleccionadas.length !== 11){

    alert(
        "Debes seleccionar exactamente 11 jugadoras."
    );

    return;

}

//==================================================
// LIMPIAR Y REPARTIR TODAS LAS FICHAS
//==================================================

//==================================================
// RECOGER TODAS LAS FICHAS EXISTENTES
//==================================================

const todasLasFichas =
    Array.from(
        document.querySelectorAll(
            ".jugadora, .suplente"
        )
    );

//==================================================
// LIMPIAR CAMPO Y BANQUILLO
//==================================================

if(campo){

    campo
        .querySelectorAll(
            ".jugadora, .suplente"
        )
        .forEach(function(ficha){

            ficha.remove();

        });

}

if(banquillo){

    banquillo
        .querySelectorAll(
            ".jugadora, .suplente"
        )
        .forEach(function(ficha){

            ficha.remove();

        });

}

//==================================================
// COLOCAR LAS 11 TITULARES
//==================================================

seleccionadas.forEach(
    function(casilla, indice){

        const indicePlantilla =
            Number(
                casilla.dataset.indice
            );

        const jugadora =
            plantillaEquipo[indicePlantilla];

        if(!jugadora) return;

        const ficha =
            todasLasFichas[indice];

        if(!ficha) return;

        ficha.id =
            "j" + (indice + 1);

        ficha.className =
            "jugadora";

        const dorsal =
            ficha.querySelector(".dorsal");

        const nombre =
            ficha.querySelector(".nombre");

        if(dorsal){

            dorsal.textContent =
                jugadora.dorsal;

        }

        if(nombre){

            nombre.textContent =
                jugadora.nombre;

        }

        campo.appendChild(
            ficha
        );

    }
);

//==================================================
// COLOCAR LAS NO TITULARES EN EL BANQUILLO
//==================================================

const indicesSeleccionados =
    Array.from(
        seleccionadas
    ).map(
        function(casilla){

            return Number(
                casilla.dataset.indice
            );

        }
    );

const noSeleccionadas =
    plantillaEquipo.filter(
        function(jugadora, indice){

            return !indicesSeleccionados.includes(
                indice
            );

        }
    );

noSeleccionadas.forEach(
    function(jugadora, indice){

        const ficha =
            todasLasFichas[
                11 + indice
            ];

        if(!ficha) return;

        ficha.id =
            "s" + (12 + indice);

        ficha.className =
            "suplente";

        const dorsal =
            ficha.querySelector(".dorsal");

        const nombre =
            ficha.querySelector(".nombre");

        if(dorsal){

            dorsal.textContent =
                jugadora.dorsal;

        }

        if(nombre){

            nombre.textContent =
                jugadora.nombre;

        }

        banquillo.appendChild(
            ficha
        );

    }
);
//==================================================
// COMPLETAR PLAZAS VACÍAS DEL BANQUILLO
//==================================================

const fichasUsadas =
    11 + noSeleccionadas.length;

const fichasRestantes =
    todasLasFichas.slice(
        fichasUsadas
    );

fichasRestantes.forEach(
    function(ficha, indice){

        ficha.className =
            "suplente";

        ficha.id =
            "s" +
            (fichasUsadas + indice + 1);

        const dorsal =
            ficha.querySelector(".dorsal");

        const nombre =
            ficha.querySelector(".nombre");

        if(dorsal){

            dorsal.textContent =
                "";

        }

        if(nombre){

            nombre.textContent =
                "BANQUILLO " +
                (indice + 1);

        }

        banquillo.appendChild(
            ficha
        );

    }
);
//==================================================
// COLOCAR TITULARES
//==================================================

colocarTitulares();

}
//==================================================
// RECOLOCAR SUPLENTES
//==================================================

function colocarSuplentes(){

  if(!banquillo) return;

  const suplentesActuales =
      banquillo.querySelectorAll(".suplente");

  suplentesActuales.forEach(
      function(jugadora,index){

          jugadora.style.position =
              "absolute";

          jugadora.style.left =
              "15%";

          jugadora.style.top =
              (10 + index * 9) + "%";

      }
  );

}
//==================================================
// RECOLOCAR BALÓN
//==================================================

function colocarBalon(){

  if(!balon || !campo) return;

  if(!balon.style.left){

      balon.style.position=
          "absolute";

      balon.style.left=
          "50%";

      balon.style.top=
          "50%";

  }

}
//==================================================
// ARRASTRAR BALÓN
//==================================================

function iniciarArrastreBalon(evento){

  if(!balon || !campo) return;

  evento.preventDefault();

  const rectCampo =
      campo.getBoundingClientRect();

  const rectBalon =
      balon.getBoundingClientRect();

  const offsetX =
      evento.clientX -
      rectBalon.left;

  const offsetY =
      evento.clientY -
      rectBalon.top;

  function moverBalon(e){

      let x =
          e.clientX -
          rectCampo.left -
          offsetX;

      let y =
          e.clientY -
          rectCampo.top -
          offsetY;

      const maxX =
          rectCampo.width -
          rectBalon.width;

      const maxY =
          rectCampo.height -
          rectBalon.height;

      x =
          Math.max(
              0,
              Math.min(x,maxX)
          );

      y =
          Math.max(
              0,
              Math.min(y,maxY)
          );

      balon.style.left =
          x + "px";

      balon.style.top =
          y + "px";

  }

  function soltarBalon(){

      document.removeEventListener(
          "mousemove",
          moverBalon
      );

      document.removeEventListener(
          "mouseup",
          soltarBalon
      );

      guardarPartido();

  }

  document.addEventListener(
      "mousemove",
      moverBalon
  );

  document.addEventListener(
      "mouseup",
      soltarBalon
  );

}

//==================================================
// ACTIVAR ARRASTRE DEL BALÓN
//==================================================

if(balon){

  balon.addEventListener(
      "mousedown",
      iniciarArrastreBalon
  );

}

//==================================================
// RESETEAR POSICIONES
//==================================================

function resetearPosiciones(){

  colocarTitulares();

  colocarSuplentes();

  colocarBalon();

  guardarPartido();

}

//==================================================

console.log("SCRIPT V4.2 - BLOQUE 7 OK");
//==================================================
// CAMBIOS
// BLOQUE 8
//==================================================

//==================================================
// INICIAR CAMBIO
//==================================================

if(btnCambio){

  btnCambio.addEventListener("click",function(){

      modo="cambio";

      jugadoraCambioSalida=null;

      jugadoraCambioEntrada=null;

      alert(
          "Selecciona primero una titular y después una suplente."
      );

  });

}

//==================================================
// SELECCIONAR CAMBIO
//==================================================

function seleccionarCambio(jugadora){

  if(!jugadora) return;

  //==================================================
  // PRIMER PASO — TITULAR QUE SALE
  //==================================================

  if(jugadoraCambioSalida===null){

      if(!jugadora.classList.contains("jugadora")){

          alert(
              "Primero selecciona una jugadora del campo."
          );

          return;

      }

      jugadoraCambioSalida=jugadora;

      alert(
          "Ahora selecciona una suplente."
      );

      return;

  }

  //==================================================
  // SEGUNDO PASO — SUPLENTE QUE ENTRA
  //==================================================

if(
    !jugadora.classList.contains("suplente") ||
    jugadora.classList.contains("jugadoraLesionada")
){

    alert(
        "Debes seleccionar una suplente disponible."
    );

    return;
}

  jugadoraCambioEntrada=jugadora;

  //==================================================
  // GUARDAR POSICIONES
  //==================================================

const esCambioPorLesion =
    cambioPorLesion;

const posCampo = {

    left:
        esCambioPorLesion &&
        jugadoraCambioSalida.dataset.posicionCampoLeft
            ? jugadoraCambioSalida.dataset.posicionCampoLeft
            : jugadoraCambioSalida.style.left,

    top:
        esCambioPorLesion &&
        jugadoraCambioSalida.dataset.posicionCampoTop
            ? jugadoraCambioSalida.dataset.posicionCampoTop
            : jugadoraCambioSalida.style.top

};

  const posBanquillo={

      left:
          jugadoraCambioEntrada.style.left,

      top:
          jugadoraCambioEntrada.style.top

  };

  //==================================================
  // NOMBRES ANTES DEL CAMBIO
  //==================================================

  const nombreSalida=
      obtenerNombreJugadora(
          jugadoraCambioSalida
      );
     
      

  const nombreEntrada=
      obtenerNombreJugadora(
          jugadoraCambioEntrada
      );

  //==================================================
  // MOVER TITULAR AL BANQUILLO
  //==================================================

  banquillo.appendChild(
      jugadoraCambioSalida
  );

if(esCambioPorLesion){

    jugadoraCambioSalida.className =
        "suplente jugadoraLesionada";

}else{

    jugadoraCambioSalida.className =
        "suplente";

}

  jugadoraCambioSalida.style.position=
      "absolute";

  jugadoraCambioSalida.style.left=
      posBanquillo.left;

  jugadoraCambioSalida.style.top=
      posBanquillo.top;

  //==================================================
  // MOVER SUPLENTE AL CAMPO
  //==================================================

  campo.appendChild(
      jugadoraCambioEntrada
  );

  jugadoraCambioEntrada.className=
      "jugadora";

  jugadoraCambioEntrada.style.position=
      "absolute";

  jugadoraCambioEntrada.style.left=
      posCampo.left;

  jugadoraCambioEntrada.style.top=
      posCampo.top;

  //==================================================
  // REGISTRAR EVENTO
  //==================================================

  registrarEvento(

      "🔄 Cambio: " +

      nombreSalida +

      " ↔️ " +

      nombreEntrada

  );

  //==================================================
  // REACTIVAR EVENTOS
  //==================================================

  [jugadoraCambioSalida,
   jugadoraCambioEntrada].forEach(
      function(j){

          j.removeEventListener(
              "click",
              seleccionarJugadora
          );

          j.removeEventListener(
              "mousedown",
              iniciarArrastre
          );

          j.addEventListener(
              "click",
              seleccionarJugadora
          );

          j.addEventListener(
              "mousedown",
              iniciarArrastre
          );

      }
  );

  //==================================================
  // FINALIZAR CAMBIO
  //==================================================

  modo="normal";

  jugadoraCambioSalida=null;

  jugadoraCambioEntrada=null;

cambioPorLesion = false;

  guardarPartido();

  actualizarAplicacion();

}

//==================================================
// CONECTAR CAMBIOS CON LAS JUGADORAS
//==================================================

todasLasJugadoras.forEach(function(jugadora){

  jugadora.addEventListener(
      "click",
      function(){

          if(modo==="cambio"){

              seleccionarCambio(this);

          }

      }
  );

});

//==================================================

console.log("SCRIPT V4.2 - BLOQUE 8 OK");
//==================================================
// GUARDAR, CARGAR Y POSICIONES
// BLOQUE 9
//==================================================

//==================================================
// GUARDAR PARTIDO
//==================================================

function guardarPartido(){

  const jugadoras=[];

  document
      .querySelectorAll(
          "#campo .jugadora, #banquillo .suplente"
      )
      .forEach(function(jugadora){

          jugadoras.push({

              id: jugadora.id,

              clase: jugadora.className,

              nombre:
                  obtenerNombreJugadora(jugadora),

              dorsal:
                  obtenerDorsalJugadora(jugadora),

              left:
                  jugadora.style.left,

              top:
                  jugadora.style.top

          });

      });

  const datos={

      golesLocal:
          golesLocal,

      golesVisitante:
          golesVisitante,

      segundos:
          segundos,

      estadoPartido:
          estadoPartido,

      parteActual:
          parteActual,

      historial:
          historial,

      estadisticas:
          estadisticas,

      nombreLocal:
          nombreLocal
              ? nombreLocal.value
              : "LOCAL",

      nombreVisitante:
          nombreVisitante
              ? nombreVisitante.value
              : "VISITANTE",

      balon:
          balon
          ? {

              left:
                  balon.style.left,

              top:
                  balon.style.top

          }
          : null,

      jugadoras:
          jugadoras

  };

localStorage.setItem(
    obtenerClavePartidoActual(),
    JSON.stringify(datos)
);

}

//==================================================
// GUARDAR PARTIDO FINALIZADO
//==================================================

function guardarPartidoFinalizado(){

   const partidosGuardados =
       JSON.parse(
           localStorage.getItem("partidosGuardados") || "[]"
       );

   const partidoFinalizado = {

       id:
           Date.now(),

       fecha:
           new Date().toLocaleString(),

       nombreLocal:
           nombreLocal
               ? nombreLocal.value
               : "LOCAL",

       nombreVisitante:
           nombreVisitante
               ? nombreVisitante.value
               : "VISITANTE",

       golesLocal:
           golesLocal,

       golesVisitante:
           golesVisitante,

       segundos:
           segundos,

       eventos:
           JSON.parse(
               JSON.stringify(historial)
           ),

       acta:
           textoActa
               ? textoActa.textContent
               : ""

   };


   //==================================================
   // GUARDAR EN HISTORIAL
   //==================================================

   partidosGuardados.push(
       partidoFinalizado
   );

   localStorage.setItem(
       "partidosGuardados",
       JSON.stringify(
           partidosGuardados
       )
   );


   //==================================================
   // QUITAR DEL CALENDARIO
   //==================================================

   if(idPartidoCalendarioEnJuego){

       const idPartido =
           idPartidoCalendarioEnJuego;


       console.log(
           "RETIRANDO PARTIDO DEL CALENDARIO. ID:",
           idPartido
       );


       //==================================================
       // LIGA
       //==================================================

       let partidosLiga =
           JSON.parse(
               localStorage.getItem(
                   "partidosLiga"
               ) || "[]"
           );

       partidosLiga =
           partidosLiga.filter(
               function(partido){

                   return partido.id !== idPartido;

               }
           );

       localStorage.setItem(
           "partidosLiga",
           JSON.stringify(
               partidosLiga
           )
       );


       //==================================================
       // AMISTOSOS
       //==================================================

       let partidosAmistosos =
           JSON.parse(
               localStorage.getItem(
                   "partidosAmistosos"
               ) || "[]"
           );

       partidosAmistosos =
           partidosAmistosos.filter(
               function(partido){

                   return partido.id !== idPartido;

               }
           );

       localStorage.setItem(
           "partidosAmistosos",
           JSON.stringify(
               partidosAmistosos
           )
       );


       //==================================================
       // ACTUALIZAR CALENDARIOS
       //==================================================

       mostrarCalendarioLiga();

       mostrarCalendarioAmistosos();


       //==================================================
       // LIMPIAR PARTIDO ACTUAL
       //==================================================

       partidoCalendarioActual = null;

       idPartidoCalendarioEnJuego = null;

   }


   console.log(
       "PARTIDO FINALIZADO Y GUARDADO"
   );

}

//==================================================
// CARGAR PARTIDO
//==================================================

function cargarPartido(){

  const texto=
      localStorage.getItem(
          obtenerClavePartidoActual()
      );

  // Si no hay partido guardado,
  // dejamos la configuración inicial.

  if(!texto){

      actualizarAplicacion();

      return;

  }

  let datos;

  try{

      datos=JSON.parse(texto);

  }catch(error){

      console.error(
          "Error al cargar el partido:",
          error
      );

      return;

  }

  //==================================================
  // MARCADOR
  //==================================================

  golesLocal=
      datos.golesLocal || 0;

  golesVisitante=
      datos.golesVisitante || 0;

  //==================================================
  // CRONÓMETRO
  //==================================================

  segundos=
      datos.segundos || 0;

  estadoPartido=
      datos.estadoPartido ||
      "detenido";

  parteActual=
      datos.parteActual || 1;

  //==================================================
  // HISTORIAL Y ESTADÍSTICAS
  //==================================================

  historial=
      Array.isArray(datos.historial)
      ? datos.historial
      : [];

  estadisticas=
      datos.estadisticas || {};

  //==================================================
  // NOMBRES DE EQUIPOS
  //==================================================

  if(nombreLocal){

      nombreLocal.value=
          datos.nombreLocal ||
          "LOCAL";

  }

  if(nombreVisitante){

      nombreVisitante.value=
          datos.nombreVisitante ||
          "VISITANTE";

  }

  //==================================================
  // BALÓN
  //==================================================

  if(datos.balon && balon){

      balon.style.position=
          "absolute";

      balon.style.left=
          datos.balon.left || "";

      balon.style.top=
          datos.balon.top || "";

  }

 //==================================================
// JUGADORAS
//==================================================

if(Array.isArray(datos.jugadoras)){

  datos.jugadoras.forEach(
      function(info){

          const jugadora=
              document.getElementById(
                  info.id
              );

          if(!jugadora) return;

          //==========================================
          // DECIDIR CONTENEDOR POR SU ESTADO
          //==========================================

          if(
              info.clase &&
              info.clase
                  .split(" ")
                  .includes("suplente")
          ){

              if(banquillo){

                  banquillo.appendChild(
                      jugadora
                  );

              }

          }else{

              if(campo){

                  campo.appendChild(
                      jugadora
                  );

              }

          }

          //==========================================
          // RESTAURAR CLASE
          //==========================================

          jugadora.className=
              info.clase ||
              "jugadora";

          //==========================================
          // RESTAURAR NOMBRE
          //==========================================

          const nombre=
              jugadora.querySelector(
                  ".nombre"
              );

          if(nombre){

              nombre.textContent=
                  info.nombre || "";

          }

          //==========================================
          // RESTAURAR DORSAL
          //==========================================

          const dorsal=
              jugadora.querySelector(
                  ".dorsal"
              );

          if(dorsal){

              dorsal.textContent=
                  info.dorsal || "";

          }

          //==========================================
          // RESTAURAR POSICIÓN
          //==========================================

          jugadora.style.position=
              "absolute";

          jugadora.style.left=
              info.left || "";

          jugadora.style.top=
              info.top || "";

      }
  );

}

//==================================================
// RECOLOCAR JUGADORAS
//==================================================

colocarTitulares();

colocarSuplentes();

guardarPartido();

//==================================================
// VOLVER A ACTIVAR EVENTOS
//==================================================
  document
      .querySelectorAll(
          "#campo .jugadora, #banquillo .suplente"
      )
      .forEach(function(jugadora){

          jugadora.removeEventListener(
              "click",
              seleccionarJugadora
          );

          jugadora.addEventListener(
              "click",
              seleccionarJugadora
          );

          jugadora.removeEventListener(
              "mousedown",
              iniciarArrastre
          );

          jugadora.addEventListener(
              "mousedown",
              iniciarArrastre
          );

      });

  //==================================================
  // ACTUALIZAR PANTALLA
  //==================================================

  actualizarAplicacion();

}

//==================================================
// BORRAR PARTIDO GUARDADO
//==================================================

function borrarPartidoGuardado(){

  localStorage.removeItem(
      CLAVE_GUARDADO
  );

}

//==================================================
// GUARDADO AUTOMÁTICO AL SALIR
//==================================================

window.addEventListener(
  "beforeunload",
  guardarPartido
);

//==================================================

console.log(
  "SCRIPT V4.2 - BLOQUE 9 OK"
);
//==================================================
// EDITAR JUGADORAS
// E INICIALIZACIÓN FINAL
// BLOQUE 10
//==================================================

//==================================================
// ABRIR EDICIÓN
//==================================================

function editarJugadora(jugadora){

  if(!jugadora) return;

  jugadoraSeleccionada=jugadora;

  if(numeroJugadora){

      numeroJugadora.value =
          obtenerDorsalJugadora(jugadora);

  }

  if(nombreJugadora){

      nombreJugadora.value =
          obtenerNombreJugadora(jugadora);

  }

  if(modalJugadora){

      modalJugadora.style.display="flex";

  }

}

//==================================================
// BOTÓN EDITAR
//==================================================

if(btnEditar){

  btnEditar.addEventListener(
      "click",
      function(){

          modo="editar";

          alert(
              "Selecciona la jugadora que quieres editar."
          );

      }
  );

}

//==================================================
// SELECCIONAR PARA EDITAR
//==================================================

document.addEventListener(
  "click",
  function(e){

      if(modo!=="editar") return;

      const jugadora=
          e.target.closest(
              "#campo .jugadora, #banquillo .suplente"
          );

      if(!jugadora) return;

      editarJugadora(jugadora);

      modo="normal";

  }
);

//==================================================
// GUARDAR EDICIÓN
//==================================================

if(btnGuardarJugadora){

  btnGuardarJugadora.addEventListener(
      "click",
      function(){

          if(!jugadoraSeleccionada) return;

          const nuevoNombre =
              nombreJugadora
              ? nombreJugadora.value.trim()
              : "";

          const nuevoDorsal =
              numeroJugadora
              ? numeroJugadora.value.trim()
              : "";

          const nombre =
              jugadoraSeleccionada
                  .querySelector(".nombre");

          const dorsal =
              jugadoraSeleccionada
                  .querySelector(".dorsal");

          if(nombre){

              nombre.textContent =
                  nuevoNombre;

          }

          if(dorsal){

              dorsal.textContent =
                  nuevoDorsal;

          }

          guardarPartido();

          if(modalJugadora){

              modalJugadora.style.display="none";

          }

          jugadoraSeleccionada=null;

          actualizarAplicacion();

      }
  );

}

//==================================================
// CANCELAR EDICIÓN
//==================================================

if(btnCancelarJugadora){

  btnCancelarJugadora.addEventListener(
      "click",
      function(){

          if(modalJugadora){

              modalJugadora.style.display="none";

          }

          jugadoraSeleccionada=null;

          modo="normal";

      }
  );

}

//==================================================
// CERRAR ESTADÍSTICAS
//==================================================

if(btnCerrarEstadisticas){

  btnCerrarEstadisticas.addEventListener(
      "click",
      function(){

          if(modalEstadisticas){

              modalEstadisticas.style.display="none";

          }

      }
  );

}

//==================================================
// BOTÓN EVENTOS
//==================================================

if(btnEventos){

  btnEventos.addEventListener(
      "click",
      function(){

          actualizarHistorial();

          generarActa();

          if(panelEventos){

              panelEventos.classList.toggle(
                  "oculto"
              );

          }

      }
  );

}

//==================================================
// BOTÓN ACTA
//==================================================

if(btnActa){

  btnActa.addEventListener(
      "click",
      function(){

          generarActa();

          if(panelActa){

              panelActa.classList.toggle(
                  "oculto"
              );

          }

      }
  );

}

//==================================================
// HISTORIAL DE PARTIDOS
//==================================================

function mostrarHistorial(){

   if(!listaPartidos) return;

   listaPartidos.innerHTML="";

   const partidosGuardados =
       JSON.parse(
           localStorage.getItem("partidosGuardados") || "[]"
       );

   if(partidosGuardados.length === 0){

       listaPartidos.textContent =
           "No hay partidos guardados.";

       return;

   }

   partidosGuardados
       .slice()
       .reverse()
       .forEach(function(partido){

           const bloque =
               document.createElement("div");

           bloque.className =
               "partidoGuardado";

           const titulo =
               document.createElement("h3");

           titulo.textContent =
               partido.nombreLocal +

               " " +

               partido.golesLocal +

               " - " +

               partido.golesVisitante +

               " " +

               partido.nombreVisitante;

           const fecha =
               document.createElement("p");

           fecha.textContent =
               "📅 " +

               partido.fecha;

           const boton =
               document.createElement("button");

           boton.textContent =
               "📄 Ver acta";

           boton.addEventListener(
               "click",
               function(){

                   if(textoActa){

                       textoActa.textContent =
                           partido.acta;

                   }

                   if(panelActa){

                       panelActa.classList.remove(
                           "oculto"
                       );

                   }

               }
           );

//==================================================
// BOTÓN BORRAR PARTIDO DEL HISTORIAL
//==================================================

const botonBorrar =
    document.createElement("button");

botonBorrar.textContent =
    "🗑️ Borrar";

botonBorrar.addEventListener(
    "click",
    function(){

        const confirmar =
            confirm(
                "¿Seguro que quieres borrar este partido del historial?\n\nEsta acción no se puede deshacer."
            );

        if(!confirmar) return;

        const indice =
            partidosGuardados.indexOf(
                partido
            );

        if(indice === -1) return;

        partidosGuardados.splice(
            indice,
            1
        );

        localStorage.setItem(
            "partidosGuardados",
            JSON.stringify(
                partidosGuardados
            )
        );

        mostrarHistorial();

    }
);

           bloque.appendChild(
               titulo
           );

           bloque.appendChild(
               fecha
           );

           bloque.appendChild(
               boton
           );

bloque.appendChild(
    botonBorrar
);

           listaPartidos.appendChild(
               bloque
           );

       });

}

//==================================================
// BOTÓN HISTORIAL
//==================================================

if(btnHistorial){

   btnHistorial.addEventListener(
       "click",
       function(){

           mostrarHistorial();

           if(panelHistorial){

               panelHistorial.classList.toggle(
                   "oculto"
               );

           }

       }
   );

}

//==================================================
// BOTÓN CALENDARIO
//==================================================

if(btnCalendario){

    btnCalendario.addEventListener(
        "click",
        function(){

            if(menuCalendario){

                menuCalendario.classList.toggle(
                    "oculto"
                );

            }

        }
    );

}
//==================================================
// ABRIR CALENDARIO DE LIGA
//==================================================

const panelCalendarioLiga =
    document.getElementById(
        "panelCalendarioLiga"
    );

//==================================================
// DESPLEGABLE CALENDARIO DE LIGA
//==================================================

const menuLiga =
    document.getElementById(
        "menuLiga"
    );

//==================================================
// ABRIR / CERRAR LIGA
//==================================================

if(btnCalendarioLiga){

    btnCalendarioLiga.addEventListener(
        "click",
        function(){

            if(menuLiga){

                menuLiga.classList.toggle(
                    "oculto"
                );

            }

            // MOSTRAR SIEMPRE LOS PARTIDOS GUARDADOS
            mostrarCalendarioLiga();

        }
    );

}
mostrarCalendarioLiga();
//==================================================
// FORMULARIO NUEVO PARTIDO DE LIGA
//==================================================

const btnNuevoPartidoLiga =
    document.getElementById(
        "btnNuevoPartidoLiga"
    );

const formularioPartidoLiga =
    document.getElementById(
        "formularioPartidoLiga"
    );

if(btnNuevoPartidoLiga){

    btnNuevoPartidoLiga.addEventListener(
        "click",
        function(){

            if(formularioPartidoLiga){

                formularioPartidoLiga.classList.toggle(
                    "oculto"
                );

            }

        }
    );

}
//==================================================
// GUARDAR PARTIDO DE LIGA
//==================================================

const btnGuardarPartidoLiga =
    document.getElementById(
        "btnGuardarPartidoLiga"
    );

const fechaPartidoLiga =
    document.getElementById(
        "fechaPartidoLiga"
    );

const localPartidoLiga =
    document.getElementById(
        "localPartidoLiga"
    );

const visitantePartidoLiga =
    document.getElementById(
        "visitantePartidoLiga"
    );

if(btnGuardarPartidoLiga){

    btnGuardarPartidoLiga.addEventListener(
        "click",
        function(){

            const fecha =
                fechaPartidoLiga.value;

            const local =
                localPartidoLiga.value.trim();

            const visitante =
                visitantePartidoLiga.value.trim();

            if(!fecha || !local || !visitante){

                alert(
                    "Completa la fecha, el equipo local y el equipo visitante."
                );

                return;

            }

            const partidosLiga =
                JSON.parse(
                    localStorage.getItem(
                        "partidosLiga"
                    ) || "[]"
                );

        partidosLiga.push({

    id: Date.now(),

    fecha: fecha,

    local: local,

    visitante: visitante,

    estado: "Pendiente"

});

            localStorage.setItem(
                "partidosLiga",
                JSON.stringify(
                    partidosLiga
                )
            );

// LIMPIAR FORMULARIO

fechaPartidoLiga.value = "";

localPartidoLiga.value = "";

visitantePartidoLiga.value = "";

// CERRAR FORMULARIO

formularioPartidoLiga.classList.add(
    "oculto"
);
mostrarCalendarioLiga();

            alert(
                "Partido de Liga guardado correctamente."
            );

        }
    );

}

//==================================================
// MOSTRAR CALENDARIO DE LIGA
//==================================================

function mostrarCalendarioLiga(){

    const lista =
        document.getElementById(
            "listaCalendarioLiga"
        );

    if(!lista) return;

    lista.innerHTML = "";

    const partidosLiga =
        JSON.parse(
            localStorage.getItem(
                "partidosLiga"
            ) || "[]"
        );

    if(partidosLiga.length === 0){

        lista.textContent =
            "No hay partidos de Liga.";

        return;

    }

    partidosLiga.forEach(
        function(partido){

            const bloque =
                document.createElement(
                    "div"
                );

            bloque.className =
                "partidoCalendario";

            // DATOS DEL PARTIDO

            const datos =
                document.createElement(
                    "div"
                );

            datos.textContent =
                "📅 " +
                partido.fecha +
                " — " +
                partido.local +
                " - " +
                partido.visitante;
                datos.style.cursor = "pointer";
datos.addEventListener(
    "click",
    function(){

        // Guardar el partido que hemos seleccionado
        partidoCalendarioActual = partido;
idPartidoCalendarioEnJuego = partido.id;
        // Cargar los nombres de los equipos
        if(nombreLocal){

            nombreLocal.value =
                partido.local;

        }

        if(nombreVisitante){

            nombreVisitante.value =
                partido.visitante;

        }

        // Cargar el partido correspondiente
        cargarPartido();

        // Actualizar la pantalla
        actualizarAplicacion();

        console.log(
            "PARTIDO DE LIGA ABIERTO:",
            partido.local,
            "-",
            partido.visitante,
            "ID:",
            partido.id
        );

    }
);

            // BOTÓN BORRAR

            const botonBorrar =
                document.createElement(
                    "button"
                );

            botonBorrar.textContent =
                "🗑️ Borrar";

            botonBorrar.addEventListener(
                "click",
                function(){

                    const confirmar =
                        confirm(
                            "¿Seguro que quieres borrar este partido?"
                        );

                    if(!confirmar) return;

                    const indice =
                        partidosLiga.indexOf(
                            partido
                        );

                    if(indice === -1) return;

                    partidosLiga.splice(
                        indice,
                        1
                    );

                    localStorage.setItem(
                        "partidosLiga",
                        JSON.stringify(
                            partidosLiga
                        )
                    );

                    mostrarCalendarioLiga();

                }
            );

            bloque.appendChild(
                datos
            );

            bloque.appendChild(
                botonBorrar
            );

            lista.appendChild(
                bloque
            );

        }
    );

}

mostrarCalendarioLiga();

//==================================================
// ABRIR FORMULARIO NUEVO PARTIDO AMISTOSO
//==================================================

const btnNuevoPartidoAmistoso =
    document.getElementById(
        "btnNuevoPartidoAmistoso"
    );

const formularioPartidoAmistoso =
    document.getElementById(
        "formularioPartidoAmistoso"
    );

if(btnNuevoPartidoAmistoso){

    btnNuevoPartidoAmistoso.addEventListener(
        "click",
        function(){

            if(formularioPartidoAmistoso){

                formularioPartidoAmistoso.classList.toggle(
                    "oculto"
                );

            }

        }
    );

}

//==================================================
// GUARDAR PARTIDO AMISTOSO
//==================================================

const btnGuardarPartidoAmistoso =
    document.getElementById(
        "btnGuardarPartidoAmistoso"
    );

const fechaPartidoAmistoso =
    document.getElementById(
        "fechaPartidoAmistoso"
    );

const localPartidoAmistoso =
    document.getElementById(
        "localPartidoAmistoso"
    );

const visitantePartidoAmistoso =
    document.getElementById(
        "visitantePartidoAmistoso"
    );

if(btnGuardarPartidoAmistoso){

    btnGuardarPartidoAmistoso.addEventListener(
        "click",
        function(){

            const fecha =
                fechaPartidoAmistoso.value;

            const local =
                localPartidoAmistoso.value.trim();

            const visitante =
                visitantePartidoAmistoso.value.trim();

            if(!fecha || !local || !visitante){

                alert(
                    "Completa la fecha, el equipo local y el equipo visitante."
                );

                return;

            }

            const partidosAmistosos =
                JSON.parse(
                    localStorage.getItem(
                        "partidosAmistosos"
                    ) || "[]"
                );
partidosAmistosos.push({

    id: Date.now(),

    fecha: fecha,

    local: local,

    visitante: visitante,

    estado: "Pendiente"

});

            localStorage.setItem(
                "partidosAmistosos",
                JSON.stringify(
                    partidosAmistosos
                )
            );

            formularioPartidoAmistoso.classList.add(
                "oculto"
            );

            fechaPartidoAmistoso.value = "";

            localPartidoAmistoso.value = "";

            visitantePartidoAmistoso.value = "";

            mostrarCalendarioAmistosos();

            alert(
                "Partido amistoso guardado correctamente."
            );

        }
    );

}

//==================================================
// MOSTRAR CALENDARIO DE AMISTOSOS
//==================================================

function mostrarCalendarioAmistosos(){

    const lista =
        document.getElementById(
            "listaCalendarioAmistosos"
        );

    if(!lista) return;

    lista.innerHTML = "";

    const partidosAmistosos =
        JSON.parse(
            localStorage.getItem(
                "partidosAmistosos"
            ) || "[]"
        );

    if(partidosAmistosos.length === 0){

        lista.textContent =
            "No hay partidos amistosos.";

        return;

    }

    partidosAmistosos.forEach(
        function(partido){

            const bloque =
                document.createElement(
                    "div"
                );

            bloque.className =
                "partidoCalendario";

            // DATOS DEL PARTIDO

const datos =
    document.createElement(
        "div"
    );

datos.textContent =
    "📅 " +
    partido.fecha +
    " — " +
    partido.local +
    " - " +
    partido.visitante;
datos.style.cursor = "pointer";

datos.addEventListener(
    "click",
    function(){

        // Guardar el partido seleccionado
        partidoCalendarioActual = partido;
idPartidoCalendarioEnJuego = partido.id;
        // Cargar nombres de los equipos
        if(nombreLocal){

            nombreLocal.value =
                partido.local;

        }

        if(nombreVisitante){

            nombreVisitante.value =
                partido.visitante;

        }

        // Cargar el partido correspondiente
        cargarPartido();

        // Actualizar pantalla
        actualizarAplicacion();

        console.log(
            "PARTIDO AMISTOSO ABIERTO:",
            partido.local,
            "-",
            partido.visitante,
            "ID:",
            partido.id
        );

    }
);

// BOTÓN BORRAR

const botonBorrar =
    document.createElement(
        "button"
    );

botonBorrar.textContent =
    "🗑️ Borrar";

botonBorrar.addEventListener(
    "click",
    function(){

        const confirmar =
            confirm(
                "¿Seguro que quieres borrar este partido?"
            );

        if(!confirmar) return;

        const indice =
            partidosAmistosos.indexOf(
                partido
            );

        if(indice === -1) return;

        partidosAmistosos.splice(
            indice,
            1
        );

        localStorage.setItem(
            "partidosAmistosos",
            JSON.stringify(
                partidosAmistosos
            )
        );

        mostrarCalendarioAmistosos();

    }
);

bloque.appendChild(
    datos
);

bloque.appendChild(
    botonBorrar
);

lista.appendChild(
    bloque
);

        }
    );

}

mostrarCalendarioAmistosos();

//==================================================
// ABRIR / CERRAR AMISTOSOS
//==================================================

if(btnCalendarioAmistosos){

    btnCalendarioAmistosos.addEventListener(
        "click",
        function(){

            if(menuAmistosos){

                menuAmistosos.classList.toggle(
                    "oculto"
                );

            }

        }
    );

}
//==================================================
// BOTÓN IMPRIMIR ACTA
//==================================================

if(btnImprimirActa){

   btnImprimirActa.addEventListener(
       "click",
       function(){

           if(!textoActa) return;

           const contenido =
               textoActa.textContent;

           const ventana =
               window.open(
                   "",
                   "_blank",
                   "width=900,height=700"
               );

           if(!ventana){

               alert(
                   "No se pudo abrir la ventana de impresión."
               );

               return;

           }

           ventana.document.write(`
               <!DOCTYPE html>
               <html>
               <head>
                   <meta charset="UTF-8">

                   <title>Acta del partido</title>

                   <style>

                       body{
                           font-family: Arial, sans-serif;
                           padding: 30px;
                           white-space: pre-wrap;
                       }

                   </style>

               </head>

               <body>

                   ${contenido
                       .replace(/&/g, "&amp;")
                       .replace(/</g, "&lt;")
                       .replace(/>/g, "&gt;")
                   }

               </body>
               </html>
           `);

           ventana.document.close();

           ventana.focus();

           ventana.print();

       }
   );

}

//==================================================
// BOTÓN COMPARTIR ACTA
//==================================================

if(btnCompartirActa){

   btnCompartirActa.addEventListener(
       "click",
       async function(){

           if(!textoActa) return;

           const contenido =
               textoActa.textContent.trim();

           if(!contenido){

               alert(
                   "No hay ningún acta para compartir."
               );

               return;

           }

           //==================================================
           // COMPARTIR NATIVO
           //==================================================

           if(navigator.share){

               try{

                   await navigator.share({

                       title:
                           "Acta del partido",

                       text:
                           contenido

                   });

               }catch(error){

                   if(error.name !== "AbortError"){

                       alert(
                           "No se pudo compartir el acta."
                       );

                   }

               }

               return;

           }

           //==================================================
           // SI EL DISPOSITIVO NO ADMITE COMPARTIR
           //==================================================

           try{

               await navigator.clipboard.writeText(
                   contenido
               );

               alert(
                   "El acta se ha copiado al portapapeles. Puedes pegarla en un correo, WhatsApp u otra aplicación."
               );

           }catch(error){

               alert(
                   "Este dispositivo no permite compartir directamente el acta."
               );

           }

       }
   );

}

//==================================================
// BOTÓN EQUIPO
//==================================================

if(btnEquipo){

    btnEquipo.addEventListener(
        "click",
        function(){

            if(panelEquipo){

                panelEquipo.classList.toggle(
                    "oculto"
                );

            }

        }
    );

}

//==================================================
// AÑADIR JUGADORA
//==================================================

if(btnNuevaJugadora){

    btnNuevaJugadora.addEventListener(
        "click",
        function(){

            const nombre =
                prompt(
                    "Nombre de la jugadora:"
                );

            if(!nombre) return;

            const dorsal =
                prompt(
                    "Dorsal:"
                );

            if(!dorsal) return;

            const posicion =
                prompt(
                    "Posición (POR, DEF, MED o DEL):"
                );

            if(!posicion) return;

            plantillaEquipo.push({

                nombre:
                    nombre.trim(),

                dorsal:
                    dorsal.trim(),

                posicion:
                    posicion.trim().toUpperCase()

            });

            localStorage.setItem(

                CLAVE_PLANTILLA,

                JSON.stringify(
                    plantillaEquipo
                )

            );
            

            mostrarPlantillaEquipo();

        }
    );

}
//==================================================
// MOSTRAR PLANTILLA DEL EQUIPO
//==================================================

function mostrarPlantillaEquipo(){

    if(!listaEquipo) return;

    listaEquipo.innerHTML = "";

    // Ordenar por dorsal
    plantillaEquipo.sort(
        function(a, b){

            return (
                Number(a.dorsal) -
                Number(b.dorsal)
            );

        }
    );

    plantillaEquipo.forEach(
        function(jugadora, indice){

            const fila =
                document.createElement("div");

            fila.className =
                "filaJugadoraEquipo";
             // CASILLA DE SELECCIÓN

const casilla =
    document.createElement("input");

casilla.type =
    "checkbox";

casilla.className =
    "seleccionarTitular";

casilla.dataset.indice =
    indice;   

    casilla.addEventListener(
    "change",
    function(){

        const seleccionadas =
            document.querySelectorAll(
                ".seleccionarTitular:checked"
            );

        if(seleccionadas.length > 11){

            this.checked = false;

            alert(
                "Solo puedes seleccionar 11 jugadoras titulares."
            );

        }

    }
);

            // DORSAL
            const dorsal =
                document.createElement("span");

            dorsal.textContent =
                jugadora.dorsal;

            // NOMBRE
            const nombre =
                document.createElement("span");

            nombre.textContent =
                jugadora.nombre;

            // POSICIÓN
            const posicion =
                document.createElement("span");

            posicion.textContent =
                jugadora.posicion;

            // BOTÓN EDITAR
            const btnEditar =
                document.createElement("button");

            btnEditar.textContent =
                "✏️ Editar";

            btnEditar.addEventListener(
                "click",
                function(){

                    const nuevoNombre =
                        prompt(
                            "Nombre de la jugadora:",
                            jugadora.nombre
                        );

                    if(nuevoNombre === null) return;

                    const nuevoDorsal =
                        prompt(
                            "Dorsal:",
                            jugadora.dorsal
                        );

                    if(nuevoDorsal === null) return;

                    const nuevaPosicion =
                        prompt(
                            "Posición (POR, DEF, MED o DEL):",
                            jugadora.posicion
                        );

                    if(nuevaPosicion === null) return;

                    plantillaEquipo[indice] = {

                        nombre:
                            nuevoNombre.trim(),

                        dorsal:
                            nuevoDorsal.trim(),

                        posicion:
                            nuevaPosicion
                                .trim()
                                .toUpperCase()

                    };

                    localStorage.setItem(
                        CLAVE_PLANTILLA,
                        JSON.stringify(
                            plantillaEquipo
                        )
                    );

                    mostrarPlantillaEquipo();

                }
            );

            // BOTÓN ELIMINAR
            const btnEliminar =
                document.createElement("button");

            btnEliminar.textContent =
                "🗑️ Eliminar";

            btnEliminar.addEventListener(
                "click",
                function(){

                    if(
                        !confirm(
                            "¿Quieres eliminar a " +
                            jugadora.nombre +
                            " de la plantilla?"
                        )
                    ){

                        return;

                    }

                    plantillaEquipo.splice(
                        indice,
                        1
                    );

                    localStorage.setItem(
                        CLAVE_PLANTILLA,
                        JSON.stringify(
                            plantillaEquipo
                        )
                    );

                    mostrarPlantillaEquipo();

                }
            );

            // AÑADIR ELEMENTOS A LA FILA

fila.appendChild(casilla);

fila.appendChild(dorsal);

fila.appendChild(nombre);

fila.appendChild(posicion);

fila.appendChild(btnEditar);

fila.appendChild(btnEliminar);

         listaEquipo.appendChild(fila);

        }
    );

}
//==================================================
// BOTÓN FINALIZAR PARTIDO
//==================================================

if(btnFinalizar){

   btnFinalizar.addEventListener(
       "click",
       function(){

           if(confirm(
               "¿Quieres finalizar el partido?"
           )){

               detenerCronometro();

               generarActa();

               guardarPartidoFinalizado();

               alert(
                   "Partido finalizado."
               );

           }

       }
   );

}

//==================================================
// CARGAR PARTIDO AL FINAL
//==================================================

// IMPORTANTE:
// Aquí es donde cargamos el partido.
// No borrar el localStorage al iniciar.

cargarPartido();

mostrarPlantillaEquipo();

//==================================================
// ACTUALIZACIÓN FINAL
//==================================================

actualizarAplicacion();

console.log(
  "SCRIPT V4.2 COMPLETO - OK"
);

