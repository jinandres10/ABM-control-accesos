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
  email: string | null
  rol: 'admin' | 'operador' | 'viewer'
  creado_en: string
}

export interface PerfilForm {
  nombre: string
  email: string
  rol: 'admin' | 'operador' | 'viewer'
}


