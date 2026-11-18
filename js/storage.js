const CLAVE_SOCIOS = "socios";

const guardarSocios = (sociosAGuardar) => {
    localStorage.setItem(CLAVE_SOCIOS, JSON.stringify(sociosAGuardar));
};

const cargarSociosGuardados = () => {
    try {
        return JSON.parse(localStorage.getItem(CLAVE_SOCIOS));
    } catch {
        borrarSociosGuardados();
        return null;
    }
};

const borrarSociosGuardados = () => localStorage.removeItem(CLAVE_SOCIOS);

const vaciarStorage = () => localStorage.clear();