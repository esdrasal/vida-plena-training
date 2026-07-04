export const SABADO_ITEMS = [
  'Balones', 'Conos', 'Mesas', 'Agua', 'Sillas',
  'Bocina', 'Chalecos', 'Biblias', 'Hojas', 'Lapiceros',
]

export const SEMANA_ITEMS = [
  'Confirmar cancha', 'Publicar entreno', 'Imprimir hojas',
]

export function getWeekKey(date = new Date()) {
  const jan1 = new Date(date.getFullYear(), 0, 1)
  const week = Math.ceil(((date - jan1) / 86400000 + jan1.getDay() + 1) / 7)
  return `week-${date.getFullYear()}-${week}`
}

export function defaultChecklistState() {
  return { sabado: {}, semana: {}, otros: [] }
}
