export interface Edificio {
  id: string
  nombre: string
  latitud: number
  longitud: number
  creado_en: string
}

export interface Perfil {
  id: string
  nombre: string | null
  email: string | null
  creado_en: string
}

export interface EdificioForm {
  nombre: string
  latitud: string
  longitud: string
}

export interface PerfilForm {
  nombre: string
  email: string
}