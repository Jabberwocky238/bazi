import type { Sex } from '@jabberwocky238/bazi-engine'
import type { BaziInputData } from '@@/stores/compute'

export interface HepanState extends BaziInputData {
  name: string
}

export const defaultA: HepanState = {
  name: '左',
  mode: 'gregorian',
  year: 1990, month: 6, day: 15, hour: 12, minute: 0,
  longitude: undefined, bazi: ['', '', '', ''], sex: 1,
}

export const defaultB: HepanState = {
  name: '右',
  mode: 'gregorian',
  year: 1992, month: 8, day: 20, hour: 14, minute: 0,
  longitude: undefined, bazi: ['', '', '', ''], sex: 0 as Sex,
}
