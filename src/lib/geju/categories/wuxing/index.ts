/**
 * 五行象法 —— 按"两五行对"分组，每对拆成 1-3 个 per-pattern detector。
 * 另含不成对的特殊象法：寒木向阳 / 日照江河 / 壬骑龙背（壬骑龙背放 zhengge.ts）。
 */
export { isShuiHuoJiJi, isShuiHuoXiangZhan } from './shuihuo'
export { isMuHuoXiangJian, isMuHuoTongMing, isMuDuoHuoSai } from './muhuo'
export { isTuJinYuXiu, isTuZhongJinMai } from './tujin'
export { isHuoDuoJinRong, isHuoWangJinShuai, isJinHuoZhuYin } from './huojin'
export { isHuoTuJiaDai, isHuoYanTuZao } from './huotu'
export { isShuiDuoMuPiao, isShuiLengMuHan, isShuiMuQingHua } from './shuimu'
export { isJinHanShuiLeng, isJinBaiShuiQing } from './jinshui'
export { isMuShuHouTu } from './mutu'
export { isFuJinFaMu } from './jinmu'
export { judgeHanMu } from './寒木向阳'
export { judgeRiZhao } from './rizhao'
