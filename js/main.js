//Manejo de fechas 
const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const nombresMesesCortos = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const formatoPeriodo = (anio, mes) => `${anio}-${String(mes).padStart(2, "0")}`;

const obtenerPeriodoActual = () => {
    const fecha = new Date();
    return formatoPeriodo(fecha.getFullYear(), fecha.getMonth() + 1);
};

const sumarMeses = (periodo, cantidad) => {
    const [anio, mes] = periodo.split("-").map(Number);
    const fecha = new Date(anio, mes - 1 + cantidad, 1);
    return formatoPeriodo(fecha.getFullYear(), fecha.getMonth() + 1);
};

const nombrePeriodo = (periodo) => {
    const [anio, mes] = periodo.split("-").map(Number);
    return `${nombresMeses[mes - 1]} ${anio}`;
};

const nombrePeriodoCorto = (periodo) => {
    const [anio, mes] = periodo.split("-").map(Number);
    return `${nombresMesesCortos[mes - 1]} ${String(anio).slice(2)}`;
};

const rangoPeriodos = (desde, hasta) => {
    const periodos = [];
    for (let periodo = desde; periodo <= hasta; periodo = sumarMeses(periodo, 1)) {
        periodos.push(periodo);
    }
    return periodos;
};

const formatearMonto = (monto) => `$${monto.toLocaleString("es-AR")}`;

//Convierte "d/m/aaaa" en número para poder ordenar los pagos
const fechaANumero = (fecha) => {
    const [dia, mes, anio] = fecha.split("/").map(Number);
    return new Date(anio, mes - 1, dia).getTime();
};

class Socio {

    constructor(nombre, apellido, dni, mail, cuota, alta) {
        this.nombre = nombre;
        this.apellido = apellido;
        this.dni = dni;
        this.mail = mail;
        this.cuota = cuota;
        this.alta = alta;
        this.periodosPagados = [];
        this.historialPagos = [];
    }

//Cuotas sin pagar desde el alta hasta 12 meses a futuro
    periodosImpagos() {
        const hasta = this.periodosPagados.reduce(
            (maximo, periodo) => periodo > maximo ? periodo : maximo,
            sumarMeses(obtenerPeriodoActual(), 12)
        );
        return rangoPeriodos(this.alta, hasta).filter(periodo => !this.periodosPagados.includes(periodo));
    }

//Cuotas adeudadas
    deudas() {
        return this.periodosImpagos().filter(periodo => periodo <= obtenerPeriodoActual());
    }

    calcularMonto(cantidad, formaPago) {
        const total = this.cuota * cantidad;
        return Math.round(formaPago === "efectivo" ? total * 0.90 : total);
    }

    pagar(periodos, formaPago) {
        const monto = this.calcularMonto(periodos.length, formaPago);

        this.periodosPagados.push(...periodos);
        this.periodosPagados.sort();
        this.historialPagos.push({
            fecha: new Date().toLocaleDateString("es-AR"),
            periodos,
            monto,
            formaPago
        });
        return monto;
    }
}

const socios = [];
let dniEditando = null;
let dniPagos = "";

//Convertir a socio
const reconstruirSocio = ({ nombre, apellido, dni, mail, cuota, alta, periodosPagados, historialPagos }) => {
    const socio = new Socio(nombre, apellido, dni, mail, cuota, alta || obtenerPeriodoActual());
    socio.periodosPagados = periodosPagados || [];
    socio.historialPagos = historialPagos || [];
    return socio;
};

const formulario = document.querySelector("#formulario");
const tituloFormulario = document.querySelector(".titulo-formulario");
const inputNombre = document.querySelector(".nombre");
const inputApellido = document.querySelector(".apellido");
const inputDni = document.querySelector(".dni");
const inputMail = document.querySelector(".mail");
const buscador = document.querySelector(".buscador");
const listaSocios = document.querySelector(".lista-socios");
const totalSocios = document.querySelector(".total-socios");
const sociosActivos = document.querySelector(".socios-activos");
const totalDeuda = document.querySelector(".total-deuda");
const totalRecaudado = document.querySelector(".total-recaudado");
const botonAgregar = document.querySelector(".btn-agregar");
const botonCancelar = document.querySelector(".btn-cancelar");
const selectSocio = document.querySelector(".select-socio");
const planPago = document.querySelector(".plan-pago");
const filtroRegistro = document.querySelector(".filtro-registro");
const tablaRegistro = document.querySelector(".tabla-registro");
const tablaPagos = document.querySelector(".tabla-pagos");

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
    const alDia = socios.filter(socio => socio.deudas().length === 0);
    const adeudadas = socios.reduce((total, socio) => total + socio.deudas().length, 0);
    const recaudado = socios.reduce((total, socio) =>
        total + socio.historialPagos.reduce((subtotal, pago) => subtotal + pago.monto, 0), 0);

    totalSocios.innerText = socios.length;
    sociosActivos.innerText = alDia.length;
    totalDeuda.innerText = adeudadas;
    totalRecaudado.innerText = formatearMonto(recaudado);
};

//Mostrar socios
const mostrarSocios = (lista) => {
    listaSocios.innerHTML = "";

    lista.forEach(socio => {
        const { nombre, apellido, dni, mail, cuota, alta, periodosPagados } = socio;

        const deudas = socio.deudas().length;
        const estado = deudas === 0 ? "Al día" : `Debe ${deudas} ${deudas === 1 ? "cuota" : "cuotas"}`;
        const pagadoHasta = periodosPagados.length > 0 ? nombrePeriodo(periodosPagados[periodosPagados.length - 1]) : "Sin pagos";

        listaSocios.innerHTML += `
            <div class="socio">
                <h3>${nombre} ${apellido}</h3>
                <p>DNI: ${dni}</p>
                <p>Mail: ${mail}</p>
                <p>Cuota: ${formatearMonto(cuota)}</p>
                <p>Alta: ${nombrePeriodo(alta)}</p>
                <p>Pagado hasta: ${pagadoHasta}</p>
                <p>Estado: ${estado}</p>
                <button class="pagar${dni}">Gestionar pagos</button>
                <button class="editar${dni}">Editar socio</button>
                <button class="eliminar${dni}">Eliminar socio</button>
            </div>
        `;
    });

    lista.forEach(socio => {
        const { dni, nombre } = socio;

//Gestionar pagos
        document.querySelector(".pagar" + dni).addEventListener("click", () => {
            dniPagos = dni;
            mostrarSelect();
            mostrarPlan();
            document.querySelector("#pagos").scrollIntoView();
        });

//Editar socio
        document.querySelector(".editar" + dni).addEventListener("click", () => {
            iniciarEdicion(socio);
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
                if (dniPagos === dni) dniPagos = "";
                if (dniEditando === dni) salirEdicion();
                mostrarMensaje(`Socio ${nombre} eliminado`);
                actualizarVistas();
            });
        });
    });
};

//Tabla con el historial de pagos
const armarTablaPagos = (pagos, conSocio) => {
    if (pagos.length === 0) return `<p class="vacio">Todavía no hay pagos registrados</p>`;

    const filas = pagos.map(pago => `
        <tr>
            <td>${pago.fecha}</td>
            ${conSocio ? `<td>${pago.socio}</td>` : ""}
            <td class="celda-cuotas">${(pago.periodos || []).map(nombrePeriodoCorto).join(", ") || "-"}</td>
            <td>${pago.formaPago}</td>
            <td>${formatearMonto(pago.monto)}</td>
        </tr>
    `).join("");

    return `
        <div class="tabla-scroll">
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        ${conSocio ? "<th>Socio</th>" : ""}
                        <th>Cuotas</th>
                        <th>Forma de pago</th>
                        <th>Monto</th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
        </div>
    `;
};

//Apartado de pagos
const mostrarSelect = () => {
    selectSocio.innerHTML = `<option value="">Elegí un socio</option>`;

    socios.forEach(({ nombre, apellido, dni }) => {
        selectSocio.innerHTML += `<option value="${dni}">${apellido}, ${nombre} (DNI ${dni})</option>`;
    });

    selectSocio.value = dniPagos;
};

//Plan de pago del socio seleccionado
const mostrarPlan = () => {
    const socio = socios.find(socio => socio.dni === dniPagos);

    if (!socio) {
        planPago.innerHTML = `<p class="vacio">Elegí un socio para ver su plan de pago, pagar cuotas adeudadas o adelantar cuotas.</p>`;
        return;
    }

    const { nombre, apellido, dni, cuota, periodosPagados, historialPagos } = socio;
    const actual = obtenerPeriodoActual();
    const deudas = socio.deudas().length;
    const pagadoHasta = periodosPagados.length > 0 ? nombrePeriodo(periodosPagados[periodosPagados.length - 1]) : "Sin pagos";
    const hasta = periodosPagados.reduce((maximo, periodo) => periodo > maximo ? periodo : maximo, sumarMeses(actual, 12));

    const periodos = rangoPeriodos(socio.alta, hasta).map(periodo => {
        const pagada = periodosPagados.includes(periodo);
        const estado = pagada ? "pagada" : periodo <= actual ? "adeudada" : "adelanto";
        const texto = pagada ? "Pagada" : periodo <= actual ? "Adeudada" : "Adelanto";

        return `
            <label class="periodo ${estado}">
                <input type="checkbox" value="${periodo}" ${pagada ? "checked disabled" : ""}>
                <span>${nombrePeriodo(periodo)}<small>${texto}</small></span>
            </label>
        `;
    }).join("");

    const pagosSocio = [...historialPagos].reverse().sort((a, b) => fechaANumero(b.fecha) - fechaANumero(a.fecha));

    planPago.innerHTML = `
        <div class="plan-resumen">
            <h3>${nombre} ${apellido} - DNI ${dni}</h3>
            <p>Cuota mensual: ${formatearMonto(cuota)}</p>
            <p>Cuotas adeudadas: ${deudas} (${formatearMonto(deudas * cuota)})</p>
            <p>Pagado hasta: ${pagadoHasta}</p>
        </div>

        <h3 class="subtitulo">¿Qué querés pagar?</h3>
        <div class="atajos">
            <button type="button" class="atajo atajo-deudas">Pagar deudas</button>
            <button type="button" class="atajo atajo-cantidad" data-cantidad="1">1 cuota</button>
            <button type="button" class="atajo atajo-cantidad" data-cantidad="2">2 cuotas</button>
            <button type="button" class="atajo atajo-cantidad" data-cantidad="3">3 cuotas</button>
            <button type="button" class="atajo atajo-cantidad" data-cantidad="6">Semestral (6)</button>
            <button type="button" class="atajo atajo-cantidad" data-cantidad="12">Anual (12)</button>
            <button type="button" class="atajo atajo-limpiar">Limpiar</button>
        </div>
        <p class="leyenda">También podés tildar las cuotas que quieras una por una.</p>

        <div class="plan-periodos">${periodos}</div>

        <label for="forma-pago">Forma de pago</label>
        <select id="forma-pago" class="forma-pago">
            <option value="efectivo">Efectivo (10% de descuento)</option>
            <option value="tarjeta">Tarjeta</option>
        </select>

        <p class="plan-total"></p>
        <button type="button" class="btn-agregar btn-registrar-pago">Registrar pago</button>

        <h3 class="subtitulo">Historial de pagos de ${nombre}</h3>
        ${armarTablaPagos(pagosSocio, false)}
    `;

    const marcarPeriodos = (lista) => {
        planPago.querySelectorAll(".periodo input:not(:disabled)").forEach(input => {
            input.checked = lista.includes(input.value);
        });
        actualizarTotal();
    };

    const obtenerElegidos = () =>
        [...planPago.querySelectorAll(".periodo input:not(:disabled):checked")].map(input => input.value);

    const actualizarTotal = () => {
        const cantidad = obtenerElegidos().length;
        const formaPago = planPago.querySelector(".forma-pago").value;
        const monto = socio.calcularMonto(cantidad, formaPago);

        planPago.querySelector(".plan-total").innerText =
            `Cuotas elegidas: ${cantidad} - Total a pagar: ${formatearMonto(monto)}`;
    };

    planPago.querySelector(".atajo-deudas").addEventListener("click", () => marcarPeriodos(socio.deudas()));
    planPago.querySelector(".atajo-limpiar").addEventListener("click", () => marcarPeriodos([]));
    planPago.querySelectorAll(".atajo-cantidad").forEach(boton => {
        boton.addEventListener("click", () =>
            marcarPeriodos(socio.periodosImpagos().slice(0, Number(boton.dataset.cantidad))));
    });
    planPago.querySelectorAll(".periodo input").forEach(input => input.addEventListener("change", actualizarTotal));
    planPago.querySelector(".forma-pago").addEventListener("change", actualizarTotal);
    actualizarTotal();

//Registrar pago
    planPago.querySelector(".btn-registrar-pago").addEventListener("click", () => {
        const elegidos = obtenerElegidos();

        if (elegidos.length === 0) {
            mostrarMensaje("Elegí al menos una cuota para pagar");
            return;
        }

        const formaPago = planPago.querySelector(".forma-pago").value;
        const monto = socio.calcularMonto(elegidos.length, formaPago);

        Swal.fire({
            title: `Confirmar pago de ${nombre}`,
            html: `<p>Cuotas: ${elegidos.map(nombrePeriodoCorto).join(", ")}</p>
                   <p>Total: ${formatearMonto(monto)} en ${formaPago}</p>`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Confirmar pago",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#154",
            cancelButtonColor: "#d82a17"
        }).then((resultado) => {
            if (!resultado.isConfirmed) return;

            socio.pagar(elegidos, formaPago);
            guardarSocios(socios);
            Swal.fire({
                title: "Pago registrado",
                text: `${nombre} pagó ${elegidos.length} ${elegidos.length === 1 ? "cuota" : "cuotas"} (${formatearMonto(monto)}) en ${formaPago}.`,
                icon: "success",
                confirmButtonColor: "#154"
            });
            actualizarVistas();
        });
    });
};

selectSocio.addEventListener("change", () => {
    dniPagos = selectSocio.value;
    mostrarPlan();
});

//Registro de los últimos 12 meses de todos los socios
const mostrarRegistro = () => {
    const actual = obtenerPeriodoActual();
    const periodos = rangoPeriodos(sumarMeses(actual, -11), actual);
    const filtro = filtroRegistro.value;

    const lista = socios.filter(socio =>
        filtro === "todos" ||
        (filtro === "deuda" ? socio.deudas().length > 0 : socio.deudas().length === 0)
    );

    if (lista.length === 0) {
        tablaRegistro.innerHTML = `<p class="vacio">No hay socios para mostrar</p>`;
    } else {
        const encabezados = periodos.map(periodo => `<th>${nombrePeriodoCorto(periodo)}</th>`).join("");

        const filas = lista.map(socio => {
            const celdas = periodos.map(periodo => {
                if (periodo < socio.alta) return `<td class="celda-sin-alta">-</td>`;
                return socio.periodosPagados.includes(periodo)
                    ? `<td class="celda-pagada">✔</td>`
                    : `<td class="celda-adeudada">✘</td>`;
            }).join("");

            return `<tr><th>${socio.apellido}, ${socio.nombre}</th>${celdas}<td>${socio.deudas().length}</td></tr>`;
        }).join("");

        tablaRegistro.innerHTML = `
            <div class="tabla-scroll">
                <table>
                    <thead>
                        <tr><th>Socio</th>${encabezados}<th>Deuda</th></tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>
        `;
    }

    const pagos = socios.flatMap(socio =>
        [...socio.historialPagos].reverse().map(pago => ({ ...pago, socio: `${socio.nombre} ${socio.apellido}` }))
    );
    pagos.sort((a, b) => fechaANumero(b.fecha) - fechaANumero(a.fecha));

    tablaPagos.innerHTML = armarTablaPagos(pagos, true);
};

filtroRegistro.addEventListener("change", mostrarRegistro);

//Actualizar todas las vistas
const actualizarVistas = () => {
    actualizarResumen();
    buscarSocios();
    mostrarSelect();
    mostrarPlan();
    mostrarRegistro();
};

//Errores del formulario
const mostrarError = (input, texto) => {
    input.classList.toggle("invalido", texto !== "");
    input.nextElementSibling.textContent = texto;
};

const limpiarErrores = () => {
    [inputNombre, inputApellido, inputDni, inputMail].forEach(input => mostrarError(input, ""));
};

[inputNombre, inputApellido, inputDni, inputMail].forEach(input => {
    input.addEventListener("input", () => mostrarError(input, ""));
});

const validarTexto = (valor, etiqueta) => {
    if (valor === "") return `Ingresá el ${etiqueta}`;
    if (!/^[a-záéíóúñü ]+$/i.test(valor)) return `El ${etiqueta} solo puede tener letras y espacios`;
    return "";
};

const validarDni = (dni) => {
    if (dni === "") return "Ingresá el DNI";
    if (!/^\d+$/.test(dni)) return "El DNI solo puede tener números, sin puntos ni espacios";
    if (dni.length !== 8) return `El DNI debe tener 8 números y vos ingresaste ${dni.length}`;
    return "";
};

const validarMail = (mail) => {
    if (mail === "") return "Ingresá el mail";
    if (!mail.includes("@")) return "Al mail le falta el @";
    if (!/^\S+@\S+\.\S+$/.test(mail)) return "El mail no es válido, por ejemplo: nombre@dominio.com";
    return "";
};

//Edición del formulario
const iniciarEdicion = (socio) => {
    dniEditando = socio.dni;
    inputNombre.value = socio.nombre;
    inputApellido.value = socio.apellido;
    inputDni.value = socio.dni;
    inputMail.value = socio.mail;
    limpiarErrores();

    formulario.classList.add("editando");
    tituloFormulario.textContent = "Editar socio";
    botonAgregar.textContent = "Guardar cambios";
    document.querySelector("#asociate").scrollIntoView();
};

const salirEdicion = () => {
    dniEditando = null;
    formulario.reset();
    limpiarErrores();

    formulario.classList.remove("editando");
    tituloFormulario.textContent = "Asociate";
    botonAgregar.textContent = "Agregar socio";
};

botonCancelar.addEventListener("click", () => {
    salirEdicion();
    mostrarMensaje("Edición cancelada");
});

//Agregar o editar socio
botonAgregar.addEventListener("click", () => {
    const nombre = inputNombre.value.trim();
    const apellido = inputApellido.value.trim();
    const dni = inputDni.value.trim();
    const mail = inputMail.value.trim().toLowerCase();

    const socioEditado = socios.find(socio => socio.dni === dniEditando);

    const errores = [
        [inputNombre, "Nombre", validarTexto(nombre, "nombre")],
        [inputApellido, "Apellido", validarTexto(apellido, "apellido")],
        [inputDni, "DNI", validarDni(dni) ||
            (socios.some(socio => socio !== socioEditado && socio.dni === dni) ? "Ya existe un socio con ese DNI" : "")],
        [inputMail, "Mail", validarMail(mail) ||
            (socios.some(socio => socio !== socioEditado && socio.mail === mail) ? "Ya existe un socio con ese mail" : "")]
    ];

    errores.forEach(([input, etiqueta, texto]) => mostrarError(input, texto));

    const conError = errores.filter(([input, etiqueta, texto]) => texto !== "").map(([input, etiqueta]) => etiqueta);
    if (conError.length > 0) {
        mostrarMensaje(`Revisá estos campos: ${conError.join(", ")}`);
        return;
    }

    if (socioEditado) {
        socioEditado.nombre = nombre;
        socioEditado.apellido = apellido;
        socioEditado.dni = dni;
        socioEditado.mail = mail;
        if (dniPagos === dniEditando) dniPagos = dni;
        guardarSocios(socios);

        salirEdicion();
        mostrarMensaje("Socio actualizado");
        actualizarVistas();
        return;
    }

    const nuevoSocio = new Socio(nombre, apellido, dni, mail, 50000, obtenerPeriodoActual());
    socios.push(nuevoSocio);
    guardarSocios(socios);

    mostrarMensaje("Socio agregado");
    formulario.reset();
    actualizarVistas();
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

        actualizarVistas();

    } catch (err) {
        mostrarMensaje("No se pudieron cargar los socios");
    } finally {
        mensajeCarga.style.display = "none";
    }
}
obtenerSocios().then(() => setTimeout(mostrarRecordatorio, 1000));

//Mostrar recordatorio de cuotas adeudadas
const mostrarRecordatorio = () => {
    const conDeuda = socios.filter(socio => socio.deudas().length > 0).length;
    if (conDeuda > 0) {
        mostrarMensaje(`Recordatorio: hay ${conDeuda} socios con cuotas adeudadas`);
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
        dniPagos = "";
        salirEdicion();
        await obtenerSocios();
        mostrarMensaje("Socios restablecidos");
    });
});