import { shishenOf, type Shishen, type nayinOf } from '@jabberwocky238/bazi-engine'
import { GejuContext, type GejuHit } from '../types'

function shishen2Geju(shishen: Shishen): string | null {
    switch (shishen) {
        case '比肩':
        case '劫财':
            return null
        case '食神':
            return '食神格'
        case '伤官':
            return '伤官格'
        case '偏财':
            return '偏财格'
        case '正财':
            return '正财格'
        case '七杀':
            return '七杀格'
        case '正官':
            return '正官格'
        case '偏印':
            return '偏印格'
        case '正印':
            return '正印格'
    }
}

function zhengOrPian(shishen: Shishen): '正' | '偏' {
    switch (shishen) {
        case '食神':
        case '正财':
        case '正官':
        case '正印':
            return '正'
        case '伤官':
        case '七杀':
        case '偏财':
        case '偏印':
            return '偏'
    }
}


export function calcZhengGe(context: GejuContext): GejuHit | null {
    const rizhu = context.riZhu
    // 规则1:月令藏干透月干
    for (const cangGan of context.yueLing.cangGan) {
        if (context.touGan(cangGan.name, 1)) {
            const s = shishen2Geju(cangGan.shishen)
            if (s) {
                return { name: s, note: '月令透' + s }
            }
        }
    }
    // 规则2:月令藏干透年干时干
    for (const cangGan of context.yueLing.cangGan) {
        if (context.touGan(cangGan.name, 0) && context.touGan(cangGan.name, 3)) {
            const s = shishen2Geju(cangGan.shishen)
            if (s) {
                return { name: s, note: '月令透' + s }
            }
        }
    }
    // 规则3:月令藏干完全没有透干，但是月株天干在年支，日支，时支有根
    if (context.yueLing.cangGan.every(cg => !context.touGan(cg.name))) {
        const yueGan = context.pillars[1].gan
        if (context.rootGan(yueGan.name, 0) && context.rootGan(yueGan.name, 2) && context.rootGan(yueGan.name, 3)) {
            const s = shishen2Geju(yueGan.shishen as Shishen)
            if (s) {
                return { name: s, note: '月令天干有根' + s }
            }
        }
    }
    // 规则4:月柱天干在地支无根，称虚浮，看时干和年干在地支有没有根，有根则取格局，可能取到多个格局
    const yueGanName = context.pillars[1].gan.name
    const gejuCandidates: [string, number][] = [] // [格局名, 优先级]，优先级数值越小优先级越高
    if (!context.rootGan(yueGanName)) {
        // 年干(0)、时干(3)
        for (const index of [0, 3] as const) {
            const gan = context.pillars[index].gan
            if (context.rootGan(gan.name)) {
                const s = shishen2Geju(gan.shishen as Shishen)
                if (s) {
                    gejuCandidates.push([s, index])
                }
            }
        }
    }
    // 规则5，两种格局同时存在，一正一偏，取偏格
    if (gejuCandidates.length == 2) {
        const [g1, p1] = gejuCandidates[0]
        const zhengOrPian1 = zhengOrPian(context.pillars[p1].gan.shishen as Shishen)
        const [g2, p2] = gejuCandidates[1]
        const zhengOrPian2 = zhengOrPian(context.pillars[p2].gan.shishen as Shishen)
        if (zhengOrPian1 !== zhengOrPian2) {
            return { name: zhengOrPian1 === '正' ? g2 : g1, note: '月令虚浮，' + (zhengOrPian1 === '正' ? '正' : '偏') + '格' }
        }
    }
    // 规则6，两种格局同时存在，但五行不一致，按照年月日时
    if (gejuCandidates.length == 2) {
        const [g1, p1] = gejuCandidates[0]
        const [g2, p2] = gejuCandidates[1]
        return { name: p1 < p2 ? g1 : g2, note: '月令虚浮，取令格' }
    }
    // 规则7，三合局，三会局
    const sanHeJu = context.sanHeJu()
    if (sanHeJu.length > 0) {
        const wuxing = sanHeJu[0].hua
        const [_, yin] = context.wuxingGan(wuxing) // 触发缓存
        const shishen = shishenOf(rizhu.name, yin)
        const geju = shishen2Geju(shishen)
        if (geju) {
            return { name: geju, note: '三合局' }
        }
    }
    const sanHuiJu = context.sanHuiJu()
    if (sanHuiJu.length > 0) {
        const wuxing = sanHuiJu[0].hua
        const [_, yin] = context.wuxingGan(wuxing) // 触发缓存
        const shishen = shishenOf(rizhu.name, yin)
        const geju = shishen2Geju(shishen)
        if (geju) {
            return { name: geju, note: '三会局' }
        }
    }
    return null
}
