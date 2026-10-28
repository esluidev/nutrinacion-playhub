// Generado con `npm run db:types` (Supabase local levantado). No editar a mano.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "comunidad_colaboradores": {
                  Row: {
                    "activo": boolean,"comunidad_id": number,"created_at": string,"id": number,"perfil_id": number
                  }
                  Insert: {
                    "activo"?: boolean,"comunidad_id": number,"created_at"?: string,"id"?: never,"perfil_id": number
                  }
                  Update: {
                    "activo"?: boolean,"comunidad_id"?: number,"created_at"?: string,"id"?: never,"perfil_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "comunidad_colaboradores_comunidad_id_fkey"
      columns: ["comunidad_id"]
isOneToOne: false
      referencedRelation: "comunidades"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comunidad_colaboradores_perfil_id_fkey"
      columns: ["perfil_id"]
isOneToOne: false
      referencedRelation: "perfiles"
      referencedColumns: ["id"]
    }
                  ]
                },"comunidad_educadores": {
                  Row: {
                    "activo": boolean,"comunidad_id": number,"created_at": string,"educador_id": number,"id": number
                  }
                  Insert: {
                    "activo"?: boolean,"comunidad_id": number,"created_at"?: string,"educador_id": number,"id"?: never
                  }
                  Update: {
                    "activo"?: boolean,"comunidad_id"?: number,"created_at"?: string,"educador_id"?: number,"id"?: never
                  }
                  Relationships: [
                    {
      foreignKeyName: "comunidad_educadores_comunidad_id_fkey"
      columns: ["comunidad_id"]
isOneToOne: false
      referencedRelation: "comunidades"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comunidad_educadores_educador_id_fkey"
      columns: ["educador_id"]
isOneToOne: false
      referencedRelation: "educadores"
      referencedColumns: ["id"]
    }
                  ]
                },"comunidad_participantes": {
                  Row: {
                    "comunidad_id": number,"hogar_perfil_id": number,"id": number,"unido_en": string
                  }
                  Insert: {
                    "comunidad_id": number,"hogar_perfil_id": number,"id"?: never,"unido_en"?: string
                  }
                  Update: {
                    "comunidad_id"?: number,"hogar_perfil_id"?: number,"id"?: never,"unido_en"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "comunidad_participantes_comunidad_id_fkey"
      columns: ["comunidad_id"]
isOneToOne: false
      referencedRelation: "comunidades"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comunidad_participantes_hogar_perfil_id_fkey"
      columns: ["hogar_perfil_id"]
isOneToOne: false
      referencedRelation: "hogar_perfiles"
      referencedColumns: ["id"]
    }
                  ]
                },"comunidades": {
                  Row: {
                    "codigo_acceso": string | null,"codigo_acceso_desde": string | null,"correo": string | null,"created_at": string,"descripcion": string | null,"id": number,"logo": string | null,"nombre": string,"organizacion_id": number,"pais": string,"telefono": string | null
                  }
                  Insert: {
                    "codigo_acceso"?: string | null,"codigo_acceso_desde"?: string | null,"correo"?: string | null,"created_at"?: string,"descripcion"?: string | null,"id"?: never,"logo"?: string | null,"nombre": string,"organizacion_id": number,"pais": string,"telefono"?: string | null
                  }
                  Update: {
                    "codigo_acceso"?: string | null,"codigo_acceso_desde"?: string | null,"correo"?: string | null,"created_at"?: string,"descripcion"?: string | null,"id"?: never,"logo"?: string | null,"nombre"?: string,"organizacion_id"?: number,"pais"?: string,"telefono"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "comunidades_organizacion_id_fkey"
      columns: ["organizacion_id"]
isOneToOne: false
      referencedRelation: "organizaciones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comunidades_pais_fkey"
      columns: ["pais"]
isOneToOne: false
      referencedRelation: "paises"
      referencedColumns: ["codigo"]
    }
                  ]
                },"configuracion": {
                  Row: {
                    "clave": string,"descripcion": string | null,"id": number,"updated_at": string,"valor": string | null
                  }
                  Insert: {
                    "clave": string,"descripcion"?: string | null,"id"?: never,"updated_at"?: string,"valor"?: string | null
                  }
                  Update: {
                    "clave"?: string,"descripcion"?: string | null,"id"?: never,"updated_at"?: string,"valor"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"educador_grupo_miembros": {
                  Row: {
                    "comunidad_id": number,"educador_grupo_id": number,"educador_id": number,"id": number
                  }
                  Insert: {
                    "comunidad_id": number,"educador_grupo_id": number,"educador_id": number,"id"?: never
                  }
                  Update: {
                    "comunidad_id"?: number,"educador_grupo_id"?: number,"educador_id"?: number,"id"?: never
                  }
                  Relationships: [
                    {
      foreignKeyName: "educador_grupo_miembros_educador_grupo_id_comunidad_id_fkey"
      columns: ["educador_grupo_id","comunidad_id"]
isOneToOne: false
      referencedRelation: "educador_grupos"
      referencedColumns: ["id","comunidad_id"]
    },{
      foreignKeyName: "educador_grupo_miembros_educador_id_comunidad_id_fkey"
      columns: ["educador_id","comunidad_id"]
isOneToOne: false
      referencedRelation: "comunidad_educadores"
      referencedColumns: ["educador_id","comunidad_id"]
    },{
      foreignKeyName: "educador_grupo_miembros_educador_id_fkey"
      columns: ["educador_id"]
isOneToOne: false
      referencedRelation: "educadores"
      referencedColumns: ["id"]
    }
                  ]
                },"educador_grupos": {
                  Row: {
                    "activo": boolean,"comunidad_id": number,"created_at": string,"descripcion": string | null,"id": number,"nombre": string
                  }
                  Insert: {
                    "activo"?: boolean,"comunidad_id": number,"created_at"?: string,"descripcion"?: string | null,"id"?: never,"nombre": string
                  }
                  Update: {
                    "activo"?: boolean,"comunidad_id"?: number,"created_at"?: string,"descripcion"?: string | null,"id"?: never,"nombre"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "educador_grupos_comunidad_id_fkey"
      columns: ["comunidad_id"]
isOneToOne: false
      referencedRelation: "comunidades"
      referencedColumns: ["id"]
    }
                  ]
                },"educador_sesiones": {
                  Row: {
                    "created_at": string,"educador_id": number,"expira_en": string,"id": number,"token_hash": string,"ultimo_uso": string
                  }
                  Insert: {
                    "created_at"?: string,"educador_id": number,"expira_en": string,"id"?: never,"token_hash": string,"ultimo_uso"?: string
                  }
                  Update: {
                    "created_at"?: string,"educador_id"?: number,"expira_en"?: string,"id"?: never,"token_hash"?: string,"ultimo_uso"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "educador_sesiones_educador_id_fkey"
      columns: ["educador_id"]
isOneToOne: false
      referencedRelation: "educadores"
      referencedColumns: ["id"]
    }
                  ]
                },"educadores": {
                  Row: {
                    "activacion_pendiente": boolean | null,"activo": boolean,"apellido": string | null,"avatar": string | null,"biografia": string | null,"codigo_activacion_hash": string | null,"correo": string,"created_at": string,"deleted_at": string | null,"id": number,"idioma": Database["public"]['Enums']["idioma"],"nombre": string,"organizacion_id": number,"pais": string | null,"pin_bloqueado_hasta": string | null,"pin_hash": string | null,"pin_intentos_fallidos": number,"profesion": string | null,"telefono": string | null,"tiene_pin": boolean | null
                  }
                  Insert: {
                    "activacion_pendiente"?: never,"activo"?: boolean,"apellido"?: string | null,"avatar"?: string | null,"biografia"?: string | null,"codigo_activacion_hash"?: string | null,"correo": string,"created_at"?: string,"deleted_at"?: string | null,"id"?: never,"idioma"?: Database["public"]['Enums']["idioma"],"nombre": string,"organizacion_id": number,"pais"?: string | null,"pin_bloqueado_hasta"?: string | null,"pin_hash"?: string | null,"pin_intentos_fallidos"?: number,"profesion"?: string | null,"telefono"?: string | null,"tiene_pin"?: never
                  }
                  Update: {
                    "activacion_pendiente"?: never,"activo"?: boolean,"apellido"?: string | null,"avatar"?: string | null,"biografia"?: string | null,"codigo_activacion_hash"?: string | null,"correo"?: string,"created_at"?: string,"deleted_at"?: string | null,"id"?: never,"idioma"?: Database["public"]['Enums']["idioma"],"nombre"?: string,"organizacion_id"?: number,"pais"?: string | null,"pin_bloqueado_hasta"?: string | null,"pin_hash"?: string | null,"pin_intentos_fallidos"?: number,"profesion"?: string | null,"telefono"?: string | null,"tiene_pin"?: never
                  }
                  Relationships: [
                    {
      foreignKeyName: "educadores_organizacion_id_fkey"
      columns: ["organizacion_id"]
isOneToOne: false
      referencedRelation: "organizaciones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "educadores_pais_fkey"
      columns: ["pais"]
isOneToOne: false
      referencedRelation: "paises"
      referencedColumns: ["codigo"]
    }
                  ]
                },"guia_escenas": {
                  Row: {
                    "carpeta": string,"cientifico": Json | null,"consejos": Json | null,"descripcion": Json | null,"guia_id": number,"id": number,"material": Json | null,"mecanica": Json | null,"no_hace": Json | null,"objetivo": Json | null,"orden": number,"pedagogia": Json | null,"preguntas": Json | null,"psicologia": Json | null,"subtitulo": Json | null,"titulo": NonNullable<Json>,"verbo": Json | null
                  }
                  Insert: {
                    "carpeta": string,"cientifico"?: Json | null,"consejos"?: Json | null,"descripcion"?: Json | null,"guia_id": number,"id"?: never,"material"?: Json | null,"mecanica"?: Json | null,"no_hace"?: Json | null,"objetivo"?: Json | null,"orden": number,"pedagogia"?: Json | null,"preguntas"?: Json | null,"psicologia"?: Json | null,"subtitulo"?: Json | null,"titulo"?: NonNullable<Json>,"verbo"?: Json | null
                  }
                  Update: {
                    "carpeta"?: string,"cientifico"?: Json | null,"consejos"?: Json | null,"descripcion"?: Json | null,"guia_id"?: number,"id"?: never,"material"?: Json | null,"mecanica"?: Json | null,"no_hace"?: Json | null,"objetivo"?: Json | null,"orden"?: number,"pedagogia"?: Json | null,"preguntas"?: Json | null,"psicologia"?: Json | null,"subtitulo"?: Json | null,"titulo"?: NonNullable<Json>,"verbo"?: Json | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "guia_escenas_guia_id_fkey"
      columns: ["guia_id"]
isOneToOne: false
      referencedRelation: "guias"
      referencedColumns: ["id"]
    }
                  ]
                },"guias": {
                  Row: {
                    "adaptado_a": Json | null,"created_at": string,"descripcion": Json | null,"id": number,"objetivo": Json | null,"publico": Json | null,"storyboard_id": number,"updated_at": string,"version": string | null
                  }
                  Insert: {
                    "adaptado_a"?: Json | null,"created_at"?: string,"descripcion"?: Json | null,"id"?: never,"objetivo"?: Json | null,"publico"?: Json | null,"storyboard_id": number,"updated_at"?: string,"version"?: string | null
                  }
                  Update: {
                    "adaptado_a"?: Json | null,"created_at"?: string,"descripcion"?: Json | null,"id"?: never,"objetivo"?: Json | null,"publico"?: Json | null,"storyboard_id"?: number,"updated_at"?: string,"version"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "guias_storyboard_id_fkey"
      columns: ["storyboard_id"]
isOneToOne: true
      referencedRelation: "storyboards"
      referencedColumns: ["id"]
    }
                  ]
                },"hogar_perfil_avance": {
                  Row: {
                    "completado_en": string,"hogar_perfil_id": number,"id": number,"storyboard_id": number
                  }
                  Insert: {
                    "completado_en"?: string,"hogar_perfil_id": number,"id"?: never,"storyboard_id": number
                  }
                  Update: {
                    "completado_en"?: string,"hogar_perfil_id"?: number,"id"?: never,"storyboard_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "hogar_perfil_avance_hogar_perfil_id_fkey"
      columns: ["hogar_perfil_id"]
isOneToOne: false
      referencedRelation: "hogar_perfiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "hogar_perfil_avance_storyboard_id_fkey"
      columns: ["storyboard_id"]
isOneToOne: false
      referencedRelation: "storyboards"
      referencedColumns: ["id"]
    }
                  ]
                },"hogar_perfiles": {
                  Row: {
                    "anio_nacimiento": number,"avatar": string | null,"created_at": string,"genero": Database["public"]['Enums']["genero_perfil"],"hogar_id": number,"id": number,"intereses": (Database["public"]['Enums']["enfoque_salud"])[],"nombre": string
                  }
                  Insert: {
                    "anio_nacimiento": number,"avatar"?: string | null,"created_at"?: string,"genero": Database["public"]['Enums']["genero_perfil"],"hogar_id": number,"id"?: never,"intereses"?: (Database["public"]['Enums']["enfoque_salud"])[],"nombre": string
                  }
                  Update: {
                    "anio_nacimiento"?: number,"avatar"?: string | null,"created_at"?: string,"genero"?: Database["public"]['Enums']["genero_perfil"],"hogar_id"?: number,"id"?: never,"intereses"?: (Database["public"]['Enums']["enfoque_salud"])[],"nombre"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "hogar_perfiles_hogar_id_fkey"
      columns: ["hogar_id"]
isOneToOne: false
      referencedRelation: "hogares"
      referencedColumns: ["id"]
    }
                  ]
                },"hogar_sesiones": {
                  Row: {
                    "created_at": string,"expira_en": string,"hogar_id": number,"id": number,"token_hash": string,"ultimo_uso": string
                  }
                  Insert: {
                    "created_at"?: string,"expira_en": string,"hogar_id": number,"id"?: never,"token_hash": string,"ultimo_uso"?: string
                  }
                  Update: {
                    "created_at"?: string,"expira_en"?: string,"hogar_id"?: number,"id"?: never,"token_hash"?: string,"ultimo_uso"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "hogar_sesiones_hogar_id_fkey"
      columns: ["hogar_id"]
isOneToOne: false
      referencedRelation: "hogares"
      referencedColumns: ["id"]
    }
                  ]
                },"hogares": {
                  Row: {
                    "codigo_bloqueado_hasta": string | null,"codigo_intentos_fallidos": number,"correo": string,"created_at": string,"id": number,"idioma": Database["public"]['Enums']["idioma"],"nombre": string,"pais": string,"pin_bloqueado_hasta": string | null,"pin_hash": string,"pin_intentos_fallidos": number
                  }
                  Insert: {
                    "codigo_bloqueado_hasta"?: string | null,"codigo_intentos_fallidos"?: number,"correo": string,"created_at"?: string,"id"?: never,"idioma"?: Database["public"]['Enums']["idioma"],"nombre": string,"pais": string,"pin_bloqueado_hasta"?: string | null,"pin_hash": string,"pin_intentos_fallidos"?: number
                  }
                  Update: {
                    "codigo_bloqueado_hasta"?: string | null,"codigo_intentos_fallidos"?: number,"correo"?: string,"created_at"?: string,"id"?: never,"idioma"?: Database["public"]['Enums']["idioma"],"nombre"?: string,"pais"?: string,"pin_bloqueado_hasta"?: string | null,"pin_hash"?: string,"pin_intentos_fallidos"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "hogares_pais_fkey"
      columns: ["pais"]
isOneToOne: false
      referencedRelation: "paises"
      referencedColumns: ["codigo"]
    }
                  ]
                },"invitaciones": {
                  Row: {
                    "apellido": string | null,"comunidad_id": number | null,"created_at": string,"email": string | null,"estado": Database["public"]['Enums']["estado_invitacion"],"expira_en": string | null,"id": number,"idioma": Database["public"]['Enums']["idioma"],"nombre": string | null,"organizacion_id": number,"role": Database["public"]['Enums']["rol_invitacion"],"titular": boolean,"token": string,"usada_por": number | null
                  }
                  Insert: {
                    "apellido"?: string | null,"comunidad_id"?: number | null,"created_at"?: string,"email"?: string | null,"estado"?: Database["public"]['Enums']["estado_invitacion"],"expira_en"?: string | null,"id"?: never,"idioma"?: Database["public"]['Enums']["idioma"],"nombre"?: string | null,"organizacion_id": number,"role": Database["public"]['Enums']["rol_invitacion"],"titular"?: boolean,"token"?: string,"usada_por"?: number | null
                  }
                  Update: {
                    "apellido"?: string | null,"comunidad_id"?: number | null,"created_at"?: string,"email"?: string | null,"estado"?: Database["public"]['Enums']["estado_invitacion"],"expira_en"?: string | null,"id"?: never,"idioma"?: Database["public"]['Enums']["idioma"],"nombre"?: string | null,"organizacion_id"?: number,"role"?: Database["public"]['Enums']["rol_invitacion"],"titular"?: boolean,"token"?: string,"usada_por"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "invitaciones_comunidad_id_fkey"
      columns: ["comunidad_id"]
isOneToOne: false
      referencedRelation: "comunidades"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invitaciones_organizacion_id_fkey"
      columns: ["organizacion_id"]
isOneToOne: false
      referencedRelation: "organizaciones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invitaciones_usada_por_fkey"
      columns: ["usada_por"]
isOneToOne: false
      referencedRelation: "perfiles"
      referencedColumns: ["id"]
    }
                  ]
                },"jornadas": {
                  Row: {
                    "created_at": string,"descripcion": string | null,"enfoque_salud": Database["public"]['Enums']["enfoque_salud"] | null,"fecha_fin": string | null,"fecha_inicio": string | null,"id": number,"nombre": string,"organizacion_id": number
                  }
                  Insert: {
                    "created_at"?: string,"descripcion"?: string | null,"enfoque_salud"?: Database["public"]['Enums']["enfoque_salud"] | null,"fecha_fin"?: string | null,"fecha_inicio"?: string | null,"id"?: never,"nombre": string,"organizacion_id": number
                  }
                  Update: {
                    "created_at"?: string,"descripcion"?: string | null,"enfoque_salud"?: Database["public"]['Enums']["enfoque_salud"] | null,"fecha_fin"?: string | null,"fecha_inicio"?: string | null,"id"?: never,"nombre"?: string,"organizacion_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "jornadas_organizacion_id_fkey"
      columns: ["organizacion_id"]
isOneToOne: false
      referencedRelation: "organizaciones"
      referencedColumns: ["id"]
    }
                  ]
                },"organizacion_administradores": {
                  Row: {
                    "created_at": string,"id": number,"organizacion_id": number,"perfil_id": number,"titular": boolean
                  }
                  Insert: {
                    "created_at"?: string,"id"?: never,"organizacion_id": number,"perfil_id": number,"titular"?: boolean
                  }
                  Update: {
                    "created_at"?: string,"id"?: never,"organizacion_id"?: number,"perfil_id"?: number,"titular"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "organizacion_administradores_organizacion_id_fkey"
      columns: ["organizacion_id"]
isOneToOne: false
      referencedRelation: "organizaciones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "organizacion_administradores_perfil_id_fkey"
      columns: ["perfil_id"]
isOneToOne: false
      referencedRelation: "perfiles"
      referencedColumns: ["id"]
    }
                  ]
                },"organizacion_licencias": {
                  Row: {
                    "created_at": string,"estado": Database["public"]['Enums']["estado_licencia"],"fecha_fin": string | null,"fecha_inicio": string,"id": number,"max_comunidades": number,"max_educadores": number,"max_personalizados": number,"notas": string | null,"organizacion_id": number,"paises": (string)[]
                  }
                  Insert: {
                    "created_at"?: string,"estado"?: Database["public"]['Enums']["estado_licencia"],"fecha_fin"?: string | null,"fecha_inicio": string,"id"?: never,"max_comunidades": number,"max_educadores": number,"max_personalizados"?: number,"notas"?: string | null,"organizacion_id": number,"paises"?: (string)[]
                  }
                  Update: {
                    "created_at"?: string,"estado"?: Database["public"]['Enums']["estado_licencia"],"fecha_fin"?: string | null,"fecha_inicio"?: string,"id"?: never,"max_comunidades"?: number,"max_educadores"?: number,"max_personalizados"?: number,"notas"?: string | null,"organizacion_id"?: number,"paises"?: (string)[]
                  }
                  Relationships: [
                    {
      foreignKeyName: "organizacion_licencias_organizacion_id_fkey"
      columns: ["organizacion_id"]
isOneToOne: false
      referencedRelation: "organizaciones"
      referencedColumns: ["id"]
    }
                  ]
                },"organizacion_publicaciones": {
                  Row: {
                    "comunidad_id": number | null,"created_at": string,"disponible_desde": string,"id": number,"organizacion_id": number,"storyboard_id": number | null,"temario_id": number | null
                  }
                  Insert: {
                    "comunidad_id"?: number | null,"created_at"?: string,"disponible_desde"?: string,"id"?: never,"organizacion_id": number,"storyboard_id"?: number | null,"temario_id"?: number | null
                  }
                  Update: {
                    "comunidad_id"?: number | null,"created_at"?: string,"disponible_desde"?: string,"id"?: never,"organizacion_id"?: number,"storyboard_id"?: number | null,"temario_id"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "organizacion_publicaciones_comunidad_id_fkey"
      columns: ["comunidad_id"]
isOneToOne: false
      referencedRelation: "comunidades"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "organizacion_publicaciones_organizacion_id_fkey"
      columns: ["organizacion_id"]
isOneToOne: false
      referencedRelation: "organizaciones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "organizacion_publicaciones_storyboard_id_fkey"
      columns: ["storyboard_id"]
isOneToOne: false
      referencedRelation: "storyboards"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "organizacion_publicaciones_temario_id_fkey"
      columns: ["temario_id"]
isOneToOne: false
      referencedRelation: "temarios"
      referencedColumns: ["id"]
    }
                  ]
                },"organizaciones": {
                  Row: {
                    "correo": string | null,"created_at": string,"descripcion_publica": Json | null,"id": number,"logo": string | null,"nombre": string,"perfil_publico": boolean,"telefono": string | null,"tipo_id": number | null,"website": string | null
                  }
                  Insert: {
                    "correo"?: string | null,"created_at"?: string,"descripcion_publica"?: Json | null,"id"?: never,"logo"?: string | null,"nombre": string,"perfil_publico"?: boolean,"telefono"?: string | null,"tipo_id"?: number | null,"website"?: string | null
                  }
                  Update: {
                    "correo"?: string | null,"created_at"?: string,"descripcion_publica"?: Json | null,"id"?: never,"logo"?: string | null,"nombre"?: string,"perfil_publico"?: boolean,"telefono"?: string | null,"tipo_id"?: number | null,"website"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "organizaciones_tipo_id_fkey"
      columns: ["tipo_id"]
isOneToOne: false
      referencedRelation: "tipos_organizacion"
      referencedColumns: ["id"]
    }
                  ]
                },"paises": {
                  Row: {
                    "activo": boolean,"bandera": string | null,"codigo": string,"extension": string | null,"id": number,"nombre": NonNullable<Json>,"region": string | null
                  }
                  Insert: {
                    "activo"?: boolean,"bandera"?: string | null,"codigo": string,"extension"?: string | null,"id"?: never,"nombre": NonNullable<Json>,"region"?: string | null
                  }
                  Update: {
                    "activo"?: boolean,"bandera"?: string | null,"codigo"?: string,"extension"?: string | null,"id"?: never,"nombre"?: NonNullable<Json>,"region"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"perfiles": {
                  Row: {
                    "apellido": string | null,"avatar": string | null,"created_at": string,"email": string | null,"id": number,"idioma": Database["public"]['Enums']["idioma"],"nombre": string | null,"superadmin": boolean,"usuario_id": string
                  }
                  Insert: {
                    "apellido"?: string | null,"avatar"?: string | null,"created_at"?: string,"email"?: string | null,"id"?: never,"idioma"?: Database["public"]['Enums']["idioma"],"nombre"?: string | null,"superadmin"?: boolean,"usuario_id": string
                  }
                  Update: {
                    "apellido"?: string | null,"avatar"?: string | null,"created_at"?: string,"email"?: string | null,"id"?: never,"idioma"?: Database["public"]['Enums']["idioma"],"nombre"?: string | null,"superadmin"?: boolean,"usuario_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"plantillas_correo": {
                  Row: {
                    "activo": boolean,"asunto": NonNullable<Json>,"clave": string,"cta_label": Json | null,"cuerpo": NonNullable<Json>,"id": number,"nombre": string,"updated_at": string
                  }
                  Insert: {
                    "activo"?: boolean,"asunto": NonNullable<Json>,"clave": string,"cta_label"?: Json | null,"cuerpo": NonNullable<Json>,"id"?: never,"nombre": string,"updated_at"?: string
                  }
                  Update: {
                    "activo"?: boolean,"asunto"?: NonNullable<Json>,"clave"?: string,"cta_label"?: Json | null,"cuerpo"?: NonNullable<Json>,"id"?: never,"nombre"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"storyboards": {
                  Row: {
                    "categoria": Database["public"]['Enums']["categoria_storyboard"],"clave": string,"created_at": string,"duracion_min": number | null,"edicion": Database["public"]['Enums']["edicion_storyboard"],"enfoques_salud": (Database["public"]['Enums']["enfoque_salud"])[],"estado_publicacion": Database["public"]['Enums']["estado_publicacion"],"id": number,"idioma_principal": Database["public"]['Enums']["idioma"],"idiomas": (Database["public"]['Enums']["idioma"])[],"numero_escenas": number,"organizacion_id": number | null,"paises_disponibles": (string)[],"slug": string,"subcategoria": Database["public"]['Enums']["subcategoria_storyboard"] | null,"titulo": NonNullable<Json>,"updated_at": string,"version_build": string | null
                  }
                  Insert: {
                    "categoria": Database["public"]['Enums']["categoria_storyboard"],"clave": string,"created_at"?: string,"duracion_min"?: number | null,"edicion": Database["public"]['Enums']["edicion_storyboard"],"enfoques_salud"?: (Database["public"]['Enums']["enfoque_salud"])[],"estado_publicacion"?: Database["public"]['Enums']["estado_publicacion"],"id"?: never,"idioma_principal"?: Database["public"]['Enums']["idioma"],"idiomas"?: (Database["public"]['Enums']["idioma"])[],"numero_escenas"?: number,"organizacion_id"?: number | null,"paises_disponibles"?: (string)[],"slug": string,"subcategoria"?: Database["public"]['Enums']["subcategoria_storyboard"] | null,"titulo"?: NonNullable<Json>,"updated_at"?: string,"version_build"?: string | null
                  }
                  Update: {
                    "categoria"?: Database["public"]['Enums']["categoria_storyboard"],"clave"?: string,"created_at"?: string,"duracion_min"?: number | null,"edicion"?: Database["public"]['Enums']["edicion_storyboard"],"enfoques_salud"?: (Database["public"]['Enums']["enfoque_salud"])[],"estado_publicacion"?: Database["public"]['Enums']["estado_publicacion"],"id"?: never,"idioma_principal"?: Database["public"]['Enums']["idioma"],"idiomas"?: (Database["public"]['Enums']["idioma"])[],"numero_escenas"?: number,"organizacion_id"?: number | null,"paises_disponibles"?: (string)[],"slug"?: string,"subcategoria"?: Database["public"]['Enums']["subcategoria_storyboard"] | null,"titulo"?: NonNullable<Json>,"updated_at"?: string,"version_build"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "storyboards_organizacion_id_fkey"
      columns: ["organizacion_id"]
isOneToOne: false
      referencedRelation: "organizaciones"
      referencedColumns: ["id"]
    }
                  ]
                },"temario_storyboards": {
                  Row: {
                    "id": number,"orden": number,"storyboard_id": number,"temario_id": number
                  }
                  Insert: {
                    "id"?: never,"orden": number,"storyboard_id": number,"temario_id": number
                  }
                  Update: {
                    "id"?: never,"orden"?: number,"storyboard_id"?: number,"temario_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "temario_storyboards_storyboard_id_fkey"
      columns: ["storyboard_id"]
isOneToOne: false
      referencedRelation: "storyboards"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "temario_storyboards_temario_id_fkey"
      columns: ["temario_id"]
isOneToOne: false
      referencedRelation: "temarios"
      referencedColumns: ["id"]
    }
                  ]
                },"temarios": {
                  Row: {
                    "comunidad_id": number | null,"created_at": string,"descripcion": Json | null,"estado_publicacion": Database["public"]['Enums']["estado_publicacion"],"id": number,"organizacion_id": number | null,"titulo": NonNullable<Json>,"updated_at": string
                  }
                  Insert: {
                    "comunidad_id"?: number | null,"created_at"?: string,"descripcion"?: Json | null,"estado_publicacion"?: Database["public"]['Enums']["estado_publicacion"],"id"?: never,"organizacion_id"?: number | null,"titulo": NonNullable<Json>,"updated_at"?: string
                  }
                  Update: {
                    "comunidad_id"?: number | null,"created_at"?: string,"descripcion"?: Json | null,"estado_publicacion"?: Database["public"]['Enums']["estado_publicacion"],"id"?: never,"organizacion_id"?: number | null,"titulo"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "temarios_comunidad_id_fkey"
      columns: ["comunidad_id"]
isOneToOne: false
      referencedRelation: "comunidades"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "temarios_organizacion_id_fkey"
      columns: ["organizacion_id"]
isOneToOne: false
      referencedRelation: "organizaciones"
      referencedColumns: ["id"]
    }
                  ]
                },"tipos_organizacion": {
                  Row: {
                    "activo": boolean,"codigo": string,"descripcion": Json | null,"id": number,"nombre": NonNullable<Json>,"orden": number
                  }
                  Insert: {
                    "activo"?: boolean,"codigo": string,"descripcion"?: Json | null,"id"?: never,"nombre": NonNullable<Json>,"orden"?: number
                  }
                  Update: {
                    "activo"?: boolean,"codigo"?: string,"descripcion"?: Json | null,"id"?: never,"nombre"?: NonNullable<Json>,"orden"?: number
                  }
                  Relationships: [
                    
                  ]
                },"workshop_educadores": {
                  Row: {
                    "comunidad_id": number,"created_at": string,"educador_grupo_id": number | null,"educador_id": number,"estado": Database["public"]['Enums']["estado_asignacion"],"id": number,"iniciado_en": string | null,"terminado_en": string | null,"workshop_id": number
                  }
                  Insert: {
                    "comunidad_id": number,"created_at"?: string,"educador_grupo_id"?: number | null,"educador_id": number,"estado"?: Database["public"]['Enums']["estado_asignacion"],"id"?: never,"iniciado_en"?: string | null,"terminado_en"?: string | null,"workshop_id": number
                  }
                  Update: {
                    "comunidad_id"?: number,"created_at"?: string,"educador_grupo_id"?: number | null,"educador_id"?: number,"estado"?: Database["public"]['Enums']["estado_asignacion"],"id"?: never,"iniciado_en"?: string | null,"terminado_en"?: string | null,"workshop_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "workshop_educadores_educador_grupo_id_fkey"
      columns: ["educador_grupo_id"]
isOneToOne: false
      referencedRelation: "educador_grupos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workshop_educadores_educador_id_comunidad_id_fkey"
      columns: ["educador_id","comunidad_id"]
isOneToOne: false
      referencedRelation: "comunidad_educadores"
      referencedColumns: ["educador_id","comunidad_id"]
    },{
      foreignKeyName: "workshop_educadores_educador_id_fkey"
      columns: ["educador_id"]
isOneToOne: false
      referencedRelation: "educadores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workshop_educadores_workshop_id_comunidad_id_fkey"
      columns: ["workshop_id","comunidad_id"]
isOneToOne: false
      referencedRelation: "workshops"
      referencedColumns: ["id","comunidad_id"]
    }
                  ]
                },"workshop_feedback": {
                  Row: {
                    "asistentes_reales": number,"calificacion": number,"claridad_contenido": Database["public"]['Enums']["claridad_contenido"],"created_at": string,"dificultades_grupo": string | null,"id": number,"material_faltante": string | null,"participacion_grupo": Database["public"]['Enums']["participacion_grupo"],"updated_at": string,"workshop_educador_id": number
                  }
                  Insert: {
                    "asistentes_reales": number,"calificacion": number,"claridad_contenido": Database["public"]['Enums']["claridad_contenido"],"created_at"?: string,"dificultades_grupo"?: string | null,"id"?: never,"material_faltante"?: string | null,"participacion_grupo": Database["public"]['Enums']["participacion_grupo"],"updated_at"?: string,"workshop_educador_id": number
                  }
                  Update: {
                    "asistentes_reales"?: number,"calificacion"?: number,"claridad_contenido"?: Database["public"]['Enums']["claridad_contenido"],"created_at"?: string,"dificultades_grupo"?: string | null,"id"?: never,"material_faltante"?: string | null,"participacion_grupo"?: Database["public"]['Enums']["participacion_grupo"],"updated_at"?: string,"workshop_educador_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "workshop_feedback_workshop_educador_id_fkey"
      columns: ["workshop_educador_id"]
isOneToOne: true
      referencedRelation: "workshop_educadores"
      referencedColumns: ["id"]
    }
                  ]
                },"workshops": {
                  Row: {
                    "asistentes_estimados": number | null,"cancelado_en": string | null,"comunidad_id": number,"created_at": string,"estado": Database["public"]['Enums']["estado_workshop"],"fecha": string | null,"finalizado_en": string | null,"grupo_asistente": string | null,"hora_fin": string | null,"hora_inicio": string | null,"id": number,"idioma_contenido": Database["public"]['Enums']["idioma"],"jornada_id": number | null,"modalidad": Database["public"]['Enums']["modalidad_workshop"],"motivo_cancelacion": string | null,"notas": string | null,"publicado_en": string | null,"reprogramaciones": number,"storyboard_id": number,"titulo": string | null,"ubicacion": string | null
                  }
                  Insert: {
                    "asistentes_estimados"?: number | null,"cancelado_en"?: string | null,"comunidad_id": number,"created_at"?: string,"estado"?: Database["public"]['Enums']["estado_workshop"],"fecha"?: string | null,"finalizado_en"?: string | null,"grupo_asistente"?: string | null,"hora_fin"?: string | null,"hora_inicio"?: string | null,"id"?: never,"idioma_contenido"?: Database["public"]['Enums']["idioma"],"jornada_id"?: number | null,"modalidad"?: Database["public"]['Enums']["modalidad_workshop"],"motivo_cancelacion"?: string | null,"notas"?: string | null,"publicado_en"?: string | null,"reprogramaciones"?: number,"storyboard_id": number,"titulo"?: string | null,"ubicacion"?: string | null
                  }
                  Update: {
                    "asistentes_estimados"?: number | null,"cancelado_en"?: string | null,"comunidad_id"?: number,"created_at"?: string,"estado"?: Database["public"]['Enums']["estado_workshop"],"fecha"?: string | null,"finalizado_en"?: string | null,"grupo_asistente"?: string | null,"hora_fin"?: string | null,"hora_inicio"?: string | null,"id"?: never,"idioma_contenido"?: Database["public"]['Enums']["idioma"],"jornada_id"?: number | null,"modalidad"?: Database["public"]['Enums']["modalidad_workshop"],"motivo_cancelacion"?: string | null,"notas"?: string | null,"publicado_en"?: string | null,"reprogramaciones"?: number,"storyboard_id"?: number,"titulo"?: string | null,"ubicacion"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "workshops_comunidad_id_fkey"
      columns: ["comunidad_id"]
isOneToOne: false
      referencedRelation: "comunidades"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workshops_jornada_id_fkey"
      columns: ["jornada_id"]
isOneToOne: false
      referencedRelation: "jornadas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workshops_storyboard_id_fkey"
      columns: ["storyboard_id"]
isOneToOne: false
      referencedRelation: "storyboards"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "comunidad_generar_codigo_acceso":
{ Args: { "p_comunidad_id": number }; Returns: string
                           },
"disponible_en_pais":
{ Args: { "p_pais": string,"p_paises": (string)[] }; Returns: boolean
                           },
"edicion_de_edad":
{ Args: { "p_edad": number }; Returns: Database["public"]['Enums']["edicion_storyboard"]
                           },
"educador_abrir_sesion":
{ Args: { "p_ids": (number)[] }; Returns: Json
                           },
"educador_activar":
{ Args: { "p_codigo": string,"p_correo": string,"p_pin": string }; Returns: Json
                           },
"educador_asignacion":
{ Args: { "p_ids": (number)[],"p_para": string,"p_workshop_id": number }; Returns: {
              "comunidad_id": number,
"created_at": string,
"educador_grupo_id": number | null,
"educador_id": number,
"estado": Database["public"]['Enums']["estado_asignacion"],
"id": number,
"iniciado_en": string | null,
"terminado_en": string | null,
"workshop_id": number
            }
                          SetofOptions: {
        from: "*"
        to: "workshop_educadores"
        isOneToOne: true
        isSetofReturn: false
      } },
"educador_cambiar_pin":
{ Args: { "p_pin": string,"p_token": string }; Returns: undefined
                           },
"educador_entrar":
{ Args: { "p_correo": string,"p_pin": string }; Returns: Json
                           },
"educador_falla":
{ Args: { "p_correo": string }; Returns: Json
                           },
"educador_ficha":
{ Args: { "p_ids": (number)[] }; Returns: Json
                           },
"educador_generar_codigo":
{ Args: { "p_educador_id": number }; Returns: string
                           },
"educador_guardar_feedback":
{ Args: { "p_feedback": Json,"p_token": string,"p_workshop_id": number }; Returns: Json
                           },
"educador_guia":
{ Args: { "p_token": string,"p_workshop_id": number }; Returns: Json
                           },
"educador_iniciar":
{ Args: { "p_token": string,"p_workshop_id": number }; Returns: undefined
                           },
"educador_salir":
{ Args: { "p_token": string }; Returns: undefined
                           },
"educador_sesion":
{ Args: { "p_token": string }; Returns: Json
                           },
"educador_terminar":
{ Args: { "p_token": string,"p_workshop_id": number }; Returns: undefined
                           },
"educador_workshops":
{ Args: { "p_desde"?: string,"p_hasta"?: string,"p_token": string }; Returns: Json
                           },
"educadores_de_sesion":
{ Args: { "p_token": string }; Returns: (number)[]
                           },
"enfoques_de_categoria":
{ Args: { "p_categoria": Database["public"]['Enums']["categoria_storyboard"],"p_enfoques": (Database["public"]['Enums']["enfoque_salud"])[] }; Returns: boolean
                           },
"es_superadmin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"finalizar_workshops_vencidos":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"hogar_abrir_sesion":
{ Args: { "p_hogar_id": number }; Returns: Json
                           },
"hogar_actualizar_cuenta":
{ Args: { "p_datos": Json,"p_token": string }; Returns: Json
                           },
"hogar_borrar_cuenta":
{ Args: { "p_token": string }; Returns: undefined
                           },
"hogar_borrar_perfil":
{ Args: { "p_perfil_id": number,"p_token": string }; Returns: Json
                           },
"hogar_cambiar_pin":
{ Args: { "p_pin": string,"p_token": string }; Returns: undefined
                           },
"hogar_catalogo":
{ Args: { "p_perfil_id": number,"p_token": string }; Returns: Json
                           },
"hogar_catalogo_publico":
{ Args: { "p_edicion"?: string,"p_idioma": string,"p_pais": string }; Returns: Json
                           },
"hogar_completar":
{ Args: { "p_perfil_id": number,"p_storyboard_id": number,"p_token": string }; Returns: undefined
                           },
"hogar_crear_cuenta":
{ Args: { "p_correo": string,"p_idioma": string,"p_nombre": string,"p_pais": string,"p_pin": string }; Returns: Json
                           },
"hogar_de_sesion":
{ Args: { "p_token": string }; Returns: number
                           },
"hogar_entrar":
{ Args: { "p_correo": string,"p_pin": string }; Returns: Json
                           },
"hogar_ficha":
{ Args: { "p_hogar_id": number }; Returns: Json
                           },
"hogar_guardar_perfil":
{ Args: { "p_perfil": Json,"p_token": string }; Returns: Json
                           },
"hogar_organizaciones":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"hogar_perfil_propio":
{ Args: { "p_hogar_id": number,"p_perfil_id": number }; Returns: {
              "anio_nacimiento": number,
"avatar": string | null,
"created_at": string,
"genero": Database["public"]['Enums']["genero_perfil"],
"hogar_id": number,
"id": number,
"intereses": (Database["public"]['Enums']["enfoque_salud"])[],
"nombre": string
            }
                          SetofOptions: {
        from: "*"
        to: "hogar_perfiles"
        isOneToOne: true
        isSetofReturn: false
      } },
"hogar_salir":
{ Args: { "p_token": string }; Returns: undefined
                           },
"hogar_salir_de_comunidad":
{ Args: { "p_comunidad_id": number,"p_perfil_id": number,"p_token": string }; Returns: Json
                           },
"hogar_sesion":
{ Args: { "p_token": string }; Returns: Json
                           },
"hogar_storyboard":
{ Args: { "p_idioma": Database["public"]['Enums']["idioma"],"p_sb": Database["public"]['Tables']["storyboards"]['Row'] }; Returns: Json
                           },
"hogar_unirse":
{ Args: { "p_codigo": string,"p_organizacion_id"?: number,"p_perfil_id": number,"p_token": string }; Returns: Json
                           },
"licencia_vigente":
{ Args: { "p_organizacion_id": number }; Returns: boolean
                           },
"localizado":
{ Args: { "p_idioma": Database["public"]['Enums']["idioma"],"p_respaldo"?: Database["public"]['Enums']["idioma"],"p_texto": Json }; Returns: string
                           },
"mi_perfil_id":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"mis_comunidades":
{ Args: { "solo_administradas"?: boolean }; Returns: number[]
                           },
"mis_organizaciones":
{ Args: Record<PropertyKey, never>; Returns: number[]
                           },
"organizacion_actualizar_perfil_publico":
{ Args: { "p_descripcion": Json,"p_logo": string,"p_organizacion_id": number,"p_publico": boolean }; Returns: undefined
                           },
"organizaciones_titular":
{ Args: Record<PropertyKey, never>; Returns: number[]
                           },
"organizaciones_visibles":
{ Args: Record<PropertyKey, never>; Returns: number[]
                           },
"perfiles_visibles":
{ Args: Record<PropertyKey, never>; Returns: number[]
                           },
"platform_administradores":
{ Args: { "p_organizacion_id": number }; Returns: {
              "apellido": string,"created_at": string,"email": string,"id": number,"nombre": string,"perfil_id": number,"titular": boolean,"ultimo_acceso": string
            }[]
                           },
"platform_comunidades":
{ Args: { "p_organizacion_id": number }; Returns: {
              "colaboradores": number,"created_at": string,"educadores": number,"id": number,"nombre": string,"pais": string,"participantes": number,"talleres_proximos": number
            }[]
                           },
"platform_eliminar_organizacion":
{ Args: { "p_organizacion_id": number }; Returns: undefined
                           },
"platform_uso":
{ Args: { "p_organizacion_id"?: number }; Returns: {
              "comunidades": number,"educadores": number,"educadores_sin_acceso": number,"jornadas": number,"organizacion_id": number,"participantes": number,"personalizados": number,"talleres": number,"talleres_proximos": number,"temarios": number,"ultima_actividad": string
            }[]
                           },
"publicar_storyboard":
{ Args: { "p_clave": string,"p_estado": Database["public"]['Enums']["estado_publicacion"],"p_organizacion"?: number,"p_paises": (string)[] }; Returns: undefined
                           },
"puedo_editar_temario":
{ Args: { "p_comunidad_id": number,"p_organizacion_id": number }; Returns: boolean
                           },
"sincronizar_storyboard":
{ Args: { "p_metadata": Json }; Returns: Json
                           },
"subcategoria_de_categoria":
{ Args: { "p_categoria": Database["public"]['Enums']["categoria_storyboard"],"p_subcategoria": Database["public"]['Enums']["subcategoria_storyboard"] }; Returns: boolean
                           },
"valida_storyboard_de_organizacion":
{ Args: { "p_organizacion_id": number,"p_storyboard_id": number }; Returns: undefined
                           },
"workshop_empezado":
{ Args: { "p_workshop_id": number }; Returns: boolean
                           }
          }
          Enums: {
            "categoria_storyboard": "ALIMENTACION"|"ACTIVIDAD_FISICA"|"CUIDADO_PERSONAL"|"SALUD_EMOCIONAL","claridad_contenido": "POCO_CLARA"|"CLARA"|"MUY_CLARA","edicion_storyboard": "KIDS"|"PREADOLESCENTES"|"ADOLESCENTES","enfoque_salud": "DIABETES"|"OBESIDAD"|"DESNUTRICION"|"ANEMIA"|"CELIAQUIA"|"ALERGIAS"|"HIPERTENSION"|"CARIES"|"SEDENTARISMO"|"ASMA"|"PIE_DIABETICO"|"INFECCIONES"|"AUTOESTIMA","estado_asignacion": "PENDIENTE"|"EN_CURSO"|"COMPLETADO"|"CANCELADO","estado_invitacion": "PENDIENTE"|"USADA"|"EXPIRADA"|"REVOCADA"|"RECHAZADA","estado_licencia": "ACTIVA"|"VENCIDA"|"SUSPENDIDA"|"TRIAL","estado_publicacion": "REGISTRADO"|"EN_REVISION"|"PUBLICADO"|"ARCHIVADO","estado_workshop": "BORRADOR"|"EN_REVISION"|"PUBLICADO"|"FINALIZADO"|"CANCELADO"|"ARCHIVADO","genero_perfil": "NINO"|"NINA","idioma": "es"|"en","modalidad_workshop": "PRESENCIAL"|"REMOTO"|"HIBRIDO","participacion_grupo": "BAJA"|"MEDIA"|"ALTA","rol_invitacion": "ADMIN"|"COLABORADOR","subcategoria_storyboard": "NUTRIENTES"|"HIDRATACION"|"CRECIMIENTO"|"ENERGIA"|"DIGESTION"|"PREVENCION"|"PROCESADOS"|"TEMPORADA"|"FUERZA"|"COORDINACION"|"HIGIENE"|"RUTINAS"|"PIEL"|"DESCANSO"|"ACEPTACION"|"CREENCIAS"|"MEDICINA"|"HABITOS"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "categoria_storyboard": ["ALIMENTACION", "ACTIVIDAD_FISICA", "CUIDADO_PERSONAL", "SALUD_EMOCIONAL"],"claridad_contenido": ["POCO_CLARA", "CLARA", "MUY_CLARA"],"edicion_storyboard": ["KIDS", "PREADOLESCENTES", "ADOLESCENTES"],"enfoque_salud": ["DIABETES", "OBESIDAD", "DESNUTRICION", "ANEMIA", "CELIAQUIA", "ALERGIAS", "HIPERTENSION", "CARIES", "SEDENTARISMO", "ASMA", "PIE_DIABETICO", "INFECCIONES", "AUTOESTIMA"],"estado_asignacion": ["PENDIENTE", "EN_CURSO", "COMPLETADO", "CANCELADO"],"estado_invitacion": ["PENDIENTE", "USADA", "EXPIRADA", "REVOCADA", "RECHAZADA"],"estado_licencia": ["ACTIVA", "VENCIDA", "SUSPENDIDA", "TRIAL"],"estado_publicacion": ["REGISTRADO", "EN_REVISION", "PUBLICADO", "ARCHIVADO"],"estado_workshop": ["BORRADOR", "EN_REVISION", "PUBLICADO", "FINALIZADO", "CANCELADO", "ARCHIVADO"],"genero_perfil": ["NINO", "NINA"],"idioma": ["es", "en"],"modalidad_workshop": ["PRESENCIAL", "REMOTO", "HIBRIDO"],"participacion_grupo": ["BAJA", "MEDIA", "ALTA"],"rol_invitacion": ["ADMIN", "COLABORADOR"],"subcategoria_storyboard": ["NUTRIENTES", "HIDRATACION", "CRECIMIENTO", "ENERGIA", "DIGESTION", "PREVENCION", "PROCESADOS", "TEMPORADA", "FUERZA", "COORDINACION", "HIGIENE", "RUTINAS", "PIEL", "DESCANSO", "ACEPTACION", "CREENCIAS", "MEDICINA", "HABITOS"]
          }
        }
} as const
