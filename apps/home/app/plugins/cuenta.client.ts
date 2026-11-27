// Con la cuenta del adulto, el dispositivo y la cuenta se combinan solos (useCuenta.sincronizar): al abrir la app, al
// volver a ella y un momento después de cada cambio de un perfil (lo editado, lo terminado, dónde iba).
export default defineNuxtPlugin(() => {
  const { cuenta, sincronizar } = useCuenta()
  const cambios = useState<number>('hogar-cambios', () => 0)
  let espera: ReturnType<typeof setTimeout> | undefined

  function programar(ms: number) {
    clearTimeout(espera)
    espera = setTimeout(() => {
      if (cuenta.value) void sincronizar()
    }, ms)
  }

  watch(cambios, () => programar(1500))
  if (cuenta.value) programar(0)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && cuenta.value) programar(0)
  })
})
