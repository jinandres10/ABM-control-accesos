export interface Edificio {
  id: string
  nombre: string
  latitud: number
  longitud: number
  ediqr: string
  direccion: string | null
  creado_en: string
}

export interface EdificioForm {
  nombre: string
  latitud: string
  longitud: string
  //ediqr: string
  direccion: string | null
}


export interface Perfil {
  id: string
  nombre: string | null
  apellido: string
  telefono: string
  email: string | null
  rol: 'admin' | 'operador' | 'viewer'
  creado_en: string
}

export interface PerfilForm {
  nombre: string
  apellido: string
  telefono: string
  email: string
  rol: 'admin' | 'operador' | 'viewer'
}

/* =========================================
   INGRESO / EGRESO
========================================= */

export interface PerfilIngreso {
	id: string
	nombre: string | null;
	apellido: string | null;
}

export interface IngresoEgreso {
	id: number;

	id_usuario: string;
	usuario: string;

	perfiles?: PerfilIngreso | null;
	
	id_edificio: string;
	nombre_edificio: string;

	geo_edificio_lat: number;
	geo_edificio_lng: number;

	geo_usuario_lat: number;
	geo_usuario_lng: number;

	fecha: string;

	hora: number;
	minutos: number;
	segundos: number;

	fue_offline: boolean;

	creado_en: string;

	distancia_metros: number;

	gps_disponible: boolean;

	device_name: string;
	os: string;
	browser: string;
	user_agent: string;

	online_status: boolean;

	timestampcliente: string;

	

  	/* =========================================
	   RELACIÓN CON EDIFICIOS
	========================================= */

	edificios?: {
		id: string;
		nombre: string;
		direccion: string | null;
		latitud: number;
		longitud: number;
	};
  
}

/* =========================================
   FORMULARIO
========================================= */

export interface IngresoEgresoForm {
	id_edificio: string;
}
