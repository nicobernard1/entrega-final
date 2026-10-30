const calcularProximoVencimiento = () => {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() + 1);
    return fecha.toLocaleDateString("es-AR");
};

class Socio {

    constructor(nombre, apellido, dni, mail, cuota, vencimiento) {
        this.nombre = nombre;
        this.apellido = apellido;
        this.dni = dni;
        this.mail = mail;
        this.cuota = cuota;
        this.vencimiento = vencimiento;
        this.cuotaPagada = false;
        this.historialPagos = [];
    }

    pagar(formaPago) {
        const monto = formaPago === "efectivo" ? this.cuota * 0.90 : this.cuota;

        this.cuotaPagada = true;
        this.historialPagos.push({          
            fecha: new Date().toLocaleDateString("es-AR"),
            monto,
            formaPago
        });
        return monto;
    }
}

const socios = [];

//Convertir a socio
const reconstruirSocio = ({ nombre, apellido, dni, mail, cuota, vencimiento, cuotaPagada, historialPagos }) => {
    const socio = new Socio(nombre, apellido, dni, mail, cuota, vencimiento);
    socio.cuotaPagada = cuotaPagada;
    socio.historialPagos = historialPagos || [];
    return socio;
};

const formulario = document.querySelector("#formulario");
const inputNombre = document.querySelector(".nombre");
const inputApellido = document.querySelector(".apellido");
const inputDni = document.querySelector(".dni");
const inputMail = document.querySelector(".mail");
const buscador = document.querySelector(".buscador");
const listaSocios = document.querySelector(".lista-socios");
const totalSocios = document.querySelector(".total-socios");
const sociosActivos = document.querySelector(".socios-activos");
const totalRecaudado = document.querySelector(".total-recaudado");
const botonAgregar = document.querySelector(".btn-agregar");

//Mensajes con Toastify
const mostrarMensaje = (texto) => {
    Toastify({
        text: texto,
        duration: 3000,
        gravity: "top",
        position: "right",
        close: false,
        offset: {
            x: 20,
            y: 120
        },
        style: {
            background: "#154",
            borderRadius: "8px",
            fontSize: "22px"
        }
    }).showToast();
};

//Resumen
const actualizarResumen = () => {
    const pagadas = socios.filter(socio => socio.cuotaPagada);
    const recaudado = socios.reduce((total, socio) =>
        total + socio.historialPagos.reduce((subtotal, pago) => subtotal + pago.monto, 0), 0);

    totalSocios.innerText = socios.length;
    sociosActivos.innerText = pagadas.length;
    totalRecaudado.innerText = `$${recaudado}`;
};

//Mostrar socios
const mostrarSocios = (lista) => {
    listaSocios.innerHTML = "";

    lista.forEach(socio => {
        const { nombre, apellido, dni, mail, cuota, vencimiento, cuotaPagada } = socio;

        const estado = cuotaPagada ? "Pagada" : "Pendiente";
        const pago = cuotaPagada ? "" : `
            <button class="pagar${dni}">Pagar cuota</button>
        `;

        listaSocios.innerHTML += `
            <div class="socio">
                <h3>${nombre} ${apellido}</h3>
                <p>DNI: ${dni}</p>
                <p>Mail: ${mail}</p>
                <p>Cuota: $${cuota}</p>
                <p>Vencimiento: ${vencimiento}</p>
                <p>Estado: ${estado}</p>
                ${pago}
                <button class="eliminar${dni}">Eliminar socio</button>
            </div>
        `;
    });

    lista.forEach(socio => {
        const { dni, nombre } = socio;

//Pagar cuota
        document.querySelector(".pagar" + dni)?.addEventListener("click", () => {
            Swal.fire({
                title: `Pagar cuota de ${nombre}`,
                text: "Elegí la forma de pago (el pago en efectivo tiene 10% de descuento)",
                icon: "question",
                showDenyButton: true,
                showCancelButton: true,
                confirmButtonText: "Efectivo",
                denyButtonText: "Tarjeta",
                cancelButtonText: "Cancelar",
                confirmButtonColor: "#154",
                denyButtonColor: "#2e8b57",
                cancelButtonColor: "#d82a17"
            }).then((resultado) => {
                if (resultado.isDismissed) return;

                const formaPago = resultado.isConfirmed ? "efectivo" : "tarjeta";

                const monto = socio.pagar(formaPago);
                socio.vencimiento = calcularProximoVencimiento();
                guardarSocios(socios);
                Swal.fire({
                    title: "Pago registrado",
                    text: `${nombre} pagó $${monto} en ${formaPago}. Nuevo vencimiento: ${socio.vencimiento}`,
                    icon: "success",
                    confirmButtonColor: "#154"
                });
                buscarSocios();
                actualizarResumen();
            });
        });

//Eliminar socio
        document.querySelector(".eliminar" + dni).addEventListener("click", () => {
            Swal.fire({
                title: "¿Estás seguro?",
                text: `¿Querés eliminar al socio ${nombre}? Esta acción no se puede deshacer.`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sí, eliminar",
                cancelButtonText: "Cancelar",
                confirmButtonColor: "#d82a17",
                cancelButtonColor: "#154"
            }).then((resultado) => {
                if (!resultado.isConfirmed) return;

                socios.splice(socios.indexOf(socio), 1);
                guardarSocios(socios);
                mostrarMensaje(`Socio ${nombre} eliminado`);
                buscarSocios();
                actualizarResumen();
            });
        });
    });
};

//Agregar socio
botonAgregar.addEventListener("click", () => {
    const nombre = inputNombre.value.trim();
    const apellido = inputApellido.value.trim();
    const dni = inputDni.value.trim();
    const mail = inputMail.value.trim().toLowerCase();

    if (!/^[a-záéíóúñü ]+$/i.test(nombre) || !/^[a-záéíóúñü ]+$/i.test(apellido) || !/^\d{8}$/.test(dni) || !/^\S+@\S+\.\S+$/.test(mail)) {
        mostrarMensaje("Datos inválidos");
        return;
    }
    if (socios.some(socio => socio.dni === dni || socio.mail === mail)) {
        mostrarMensaje("El socio ya existe");
        return;
    }

    const nuevoSocio = new Socio(nombre, apellido, dni, mail, 50000, calcularProximoVencimiento());
    socios.push(nuevoSocio);
    guardarSocios(socios);

    mostrarMensaje("Socio agregado");
    formulario.reset();
    actualizarResumen();
    buscarSocios();
});

//Buscador
const buscarSocios = () => {
    const texto = buscador.value.toLowerCase();
    const encontrados = socios.filter(socio =>
        socio.nombre.toLowerCase().includes(texto) ||
        socio.apellido.toLowerCase().includes(texto) ||
        socio.dni.includes(texto)
    );
    mostrarSocios(encontrados);
};

buscador.addEventListener("input", buscarSocios);

//Traer datos desde db
const urlSocios = "./db/data.json";
const mensajeCarga = document.querySelector(".mensaje");

const traerSociosDelJson = async () => {
    const response = await fetch(urlSocios);
    if (!response.ok) throw new Error("No se encontró el archivo");
    return response.json();
};

async function obtenerSocios() {
    mensajeCarga.textContent = "Cargando socios...";
    mensajeCarga.style.display = "block";

    try {
        const datos = cargarSociosGuardados() || await traerSociosDelJson();
        socios.push(...datos.map(reconstruirSocio));

        actualizarResumen();
        buscarSocios();

    } catch (err) {
        mostrarMensaje("No se pudieron cargar los socios");
    } finally {
        mensajeCarga.style.display = "none";
    }
}
obtenerSocios().then(() => setTimeout(mostrarRecordatorio, 1000));

//Mostrar recordatorio de cuotas pendientes
const mostrarRecordatorio = () => {
    const pendientes = socios.filter(socio => !socio.cuotaPagada).length;
    if (pendientes > 0) {
        mostrarMensaje(`Recordatorio: hay ${pendientes} cuotas pendientes de cobro`);
    }
};

//Restablecer datos
const botonRestablecer = document.querySelector(".btn-restablecer");

botonRestablecer.addEventListener("click", () => {
    Swal.fire({
        title: "¿Restablecer datos?",
        text: "Se borrarán los cambios y se cargarán los socios originales.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, restablecer",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#d82a17",
        cancelButtonColor: "#154"
    }).then(async (resultado) => {
        if (!resultado.isConfirmed) return;

        vaciarStorage();
        socios.length = 0;
        buscador.value = "";
        await obtenerSocios();
        mostrarMensaje("Socios restablecidos");
    });
});