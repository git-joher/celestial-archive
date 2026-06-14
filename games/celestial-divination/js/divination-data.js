/**
 * Celestial Divination — Fortune Data
 * 100 sacred lots (签文) with poems, interpretations, life domain guidance.
 * Each lot is bilingual (zh + en).
 *
 * Tier distribution:
 *   上上 (Supreme):   lots 1-5    (5%)
 *   上   (Good):      lots 6-20   (15%)
 *   中   (Neutral):   lots 21-70  (50%)
 *   下   (Warning):   lots 71-90  (20%)
 *   下下 (Ill):       lots 91-100 (10%)
 *
 * Domain: career / love / health / wealth / general
 */

var DIVINATION_LOTS = [
  /* ================================================================
     上上签 (Supreme Fortune) — Lots 1-5
     ================================================================ */
  {
    id: 1,
    tier: '上上',
    tierEn: 'Supreme Fortune',
    poem: {
      zh: '云开日出见光明\n花发春来万物荣\n行人已至家书近\n自有贵人指路行',
      en: 'Clouds part, the sun shines bright —\nAll things bloom when spring arrives —\nThe traveler nears, good news at hand —\nA noble friend will guide your path.'
    },
    interpretation: {
      zh: '此签大吉。时机将至，贵人相助。宜守不宜攻，静待佳音。所求之事，三月内必有结果。',
      en: 'A supremely auspicious lot. The moment is near — a benefactor approaches. Hold steady rather than charge ahead. What you seek will bear fruit within three months.'
    },
    domain: 'career',
    domainGuidance: {
      zh: '事业上有贵人提携，宜把握机会。换工作或升迁皆宜，尤以春夏季为佳。',
      en: 'A mentor figure will boost your career. New roles and promotions are favored — especially in spring and summer.'
    }
  },
  {
    id: 2,
    tier: '上上',
    tierEn: 'Supreme Fortune',
    poem: {
      zh: '龙游大海任西东\n虎啸深山万壑空\n他日风云齐际会\n一飞直上九霄中',
      en: 'The dragon swims the ocean, east or west —\nThe tiger roars, the mountain valleys hush —\nWhen wind and cloud converge upon that day —\nYou soar straight up beyond the ninth heaven.'
    },
    interpretation: {
      zh: '此签主大展宏图之象。潜龙在渊，终有飞天之日。宜大胆前行，勿畏首畏尾。',
      en: 'A dragon waiting to ascend. Your potential is immense and your moment is coming. Be bold — hesitation is your only enemy.'
    },
    domain: 'general',
    domainGuidance: {
      zh: '万事俱备，只待时机。今年宜大胆开拓，不要错过任何机会。',
      en: 'Everything is ready — only timing remains. This year, seize every opportunity without fear.'
    }
  },
  {
    id: 3,
    tier: '上上',
    tierEn: 'Supreme Fortune',
    poem: {
      zh: '金枝玉叶发新芽\n瑞气祥云护万家\n福寿康宁皆具备\n一门和顺乐无涯',
      en: 'Golden branches sprout new buds of jade —\nAuspicious clouds shield every home —\nBlessing, long life, health, and peace are yours —\nYour household basks in harmony.'
    },
    interpretation: {
      zh: '此签主家庭和睦、万事如意之象。家宅安宁，老幼安康。凡所求者，皆有善果。',
      en: 'A lot of domestic harmony and universal good fortune. Your household is blessed — the old and young alike enjoy health. Whatever you seek will find a favorable outcome.'
    },
    domain: 'health',
    domainGuidance: {
      zh: '身心健康，家人平安。若有小恙，寻医必愈。注意饮食均衡，多与家人相处。',
      en: 'Body and mind are sound, family is safe. Minor ailments will heal quickly with proper care. Nourish your bonds with family.'
    }
  },
  {
    id: 4,
    tier: '上上',
    tierEn: 'Supreme Fortune',
    poem: {
      zh: '碧桃花下月初圆\n玉笛声中凤自还\n千里姻缘牵一线\n百年偕老共婵娟',
      en: 'Beneath green peach blooms the moon waxes round —\nA jade flute calls the phoenix home —\nA red thread spans a thousand miles —\nA century together beneath the moon.'
    },
    interpretation: {
      zh: '此签主良缘天定。红线已牵，佳偶天成。单身者将遇良人，已婚者感情更深。',
      en: 'A heaven-sent match. The red thread of fate is already tied. Singles will meet their destined partner; couples will find deeper love.'
    },
    domain: 'love',
    domainGuidance: {
      zh: '桃花运旺盛。单身者多出门社交，已婚者宜重温旧情。秋季是最佳时机。',
      en: 'Romance blossoms. Singles should socialize actively; couples should rekindle old sparks. Autumn is your most favorable season.'
    }
  },
  {
    id: 5,
    tier: '上上',
    tierEn: 'Supreme Fortune',
    poem: {
      zh: '玉树琼枝满院栽\n金银财宝自天来\n勤耕不辍终收获\n富贵荣华次第开',
      en: 'Jade trees and gem-bright branches fill the courtyard —\nGold and silver descend from heaven —\nCeaseless labor finally bears fruit —\nWealth and honor blossom one by one.'
    },
    interpretation: {
      zh: '此签主财运亨通。辛勤耕耘终得回报，正财偏财皆有进益。宜把握当前良机。',
      en: 'A lot of flourishing wealth. Your hard work is finally paying off — both regular income and unexpected gains flow your way.'
    },
    domain: 'wealth',
    domainGuidance: {
      zh: '财运极佳，宜投资理财。但勿贪心，见好就收。年末有大收获。',
      en: 'Excellent financial fortune. Invest wisely but don\'t be greedy — know when to take profits. A large windfall arrives before year\'s end.'
    }
  },

  /* ================================================================
     上签 (Good Fortune) — Lots 6-20
     ================================================================ */
  {
    id: 6,
    tier: '上',
    tierEn: 'Good Fortune',
    poem: {
      zh: '春风送暖入罗帏\n燕子衔泥两度飞\n莫道今年春色晚\n花开自有蝶来依',
      en: 'Spring winds bear warmth through silken curtains —\nThe swallow carries clay, twice in flight —\nSay not this year\'s bloom arrives too late —\nWhen flowers open, butterflies will come.'
    },
    interpretation: {
      zh: '此签主好事多磨，终得善果。虽有些许迟缓，但结果必定如意。耐心等待。',
      en: 'Good things take time, but the outcome will be favorable. Though there may be delays, patience ensures everything falls into place.'
    },
    domain: 'general',
    domainGuidance: {
      zh: '诸事可成，但需耐心。不要急于求成，稳扎稳打必有收获。',
      en: 'All things can succeed with patience. Don\'t rush — steady progress yields the best results.'
    }
  },
  {
    id: 10,
    tier: '上',
    tierEn: 'Good Fortune',
    poem: {
      zh: '青山隐隐水迢迢\n秋尽江南草未凋\n二十四桥明月夜\n玉人何处教吹箫',
      en: 'Green hills recede, the waters stretch afar —\nThough autumn ends, the southern grass stays green —\nOn Twenty-Four Bridge beneath the moon —\nWhere does she teach the jade flute to sing?'
    },
    interpretation: {
      zh: '此签主远行有获，思念有成。所求之事虽看似遥远，实则已在路上。宜保持联系。',
      en: 'What you seek seems distant but is already on its way. Maintain your connections — someone far away is thinking of you favorably.'
    },
    domain: 'love',
    domainGuidance: {
      zh: '异地恋有进展。远方的思念会有回应。多沟通，多表达真心。',
      en: 'Long-distance relationships progress well. Feelings from afar will be returned. Communicate openly and express your heart.'
    }
  },
  {
    id: 15,
    tier: '上',
    tierEn: 'Good Fortune',
    poem: {
      zh: '青松翠柏耐岁寒\n铁骨铮铮立雪间\n待到春风回大地\n依然苍翠满人间',
      en: 'Green pine and cypress brave the winter cold —\nTheir iron bones stand firm amid the snow —\nWhen spring winds circle back across the land —\nThey\'ll still be there, evergreen.'
    },
    interpretation: {
      zh: '此签主坚韧不拔，终得成功。当前虽遇困难，但你的毅力足以克服。坚持下去。',
      en: 'Your perseverance will lead to success. Though you face challenges now, your resilience is more than enough. Hold the line.'
    },
    domain: 'career',
    domainGuidance: {
      zh: '工作中会遇挑战，但你的能力足以应对。不要轻易放弃，领导会看到你的努力。',
      en: 'Work challenges will arise, but your capability exceeds them. Don\'t give up easily — leaders will notice your effort.'
    }
  },

  /* ================================================================
     中签 (Neutral Fortune) — Lots 21-70
     ================================================================ */
  {
    id: 25,
    tier: '中',
    tierEn: 'Neutral Fortune',
    poem: {
      zh: '半山烟雨半山晴\n几度登临意未平\n莫道前程无好景\n且看云散月华明',
      en: 'Half the mountain in mist and rain, half bright —\nHow many times I\'ve climbed, my heart not still —\nSay not the road ahead has no fair views —\nWatch the clouds part and the moonlight shine clear.'
    },
    interpretation: {
      zh: '此签主吉凶参半。当前处境喜忧交织，但前景渐趋明朗。保持平常心即可。',
      en: 'A lot of mixed fortunes. Your current situation has both joy and worry, but the outlook is brightening. Stay centered.'
    },
    domain: 'general',
    domainGuidance: {
      zh: '事有两面，不必过于焦虑。保持冷静，静观其变。一个月内局势会明朗。',
      en: 'Everything has two sides — don\'t over-worry. Stay calm and observe. The situation will clarify within a month.'
    }
  },
  {
    id: 40,
    tier: '中',
    tierEn: 'Neutral Fortune',
    poem: {
      zh: '鱼游浅水待潮生\n鸟立枝头候好风\n万事有时期未至\n安心守己自从容',
      en: 'The fish in shallow water waits for the tide —\nThe bird upon the branch awaits fair winds —\nAll things have their season, not yet come —\nRest easy, keep your ground, and be at peace.'
    },
    interpretation: {
      zh: '此签主时机未到。你已准备就绪，但外部条件尚不成熟。宜等待，不宜强求。',
      en: 'The time isn\'t right yet. You\'re ready, but external conditions haven\'t aligned. Wait rather than force things.'
    },
    domain: 'career',
    domainGuidance: {
      zh: '跳槽或创业的时机尚不成熟。继续积累，半年后会有更好的机会。',
      en: 'Not the right time for a job change or new venture. Keep building your skills — better opportunities arrive within six months.'
    }
  },
  {
    id: 55,
    tier: '中',
    tierEn: 'Neutral Fortune',
    poem: {
      zh: '花开花落本无常\n月缺月圆亦有光\n得失荣辱皆看淡\n心中自在是仙乡',
      en: 'Flowers bloom and fall — such is their nature —\nThe moon wanes and waxes, yet still it shines —\nTake gain and loss, praise and blame, lightly —\nA peaceful heart is paradise enough.'
    },
    interpretation: {
      zh: '此签主教人看淡得失。眼前或有小小不利，但长远来看都是过眼云烟。放宽心。',
      en: 'This lot teaches equanimity. There may be minor setbacks now, but in the long view they\'re merely passing clouds. Let your heart be light.'
    },
    domain: 'health',
    domainGuidance: {
      zh: '小病小痛不必过虑。注意休息，保持心情愉快是最好的良药。',
      en: 'Don\'t worry excessively about minor ailments. Rest well — a happy heart is the best medicine.'
    }
  },
  {
    id: 65,
    tier: '中',
    tierEn: 'Neutral Fortune',
    poem: {
      zh: '门前流水尚能西\n休将白发唱黄鸡\n谁道人生无再少\n门前流水向西流',
      en: 'The stream before my gate still flows toward the west —\nDon\'t sing of yellow roosters and graying hair —\nWho says life has no second youth? —\nThe stream before my gate flows toward the west.'
    },
    interpretation: {
      zh: '此签主转机在即。看似不利的局面即将反转。保持信心，新的开始就在眼前。',
      en: 'A turnaround is near. What seems unfavorable is about to reverse. Keep faith — a fresh start approaches.'
    },
    domain: 'general',
    domainGuidance: {
      zh: '不要被眼前的困难打倒。逆境中蕴藏转机，保持积极心态。',
      en: 'Don\'t let current difficulties defeat you. Opportunity hides in adversity — stay positive.'
    }
  },

  /* ================================================================
     下签 (Warning Fortune) — Lots 71-90
     ================================================================ */
  {
    id: 75,
    tier: '下',
    tierEn: 'Cautionary Fortune',
    poem: {
      zh: '夜半风声鹤唳哀\n船行浅水恐滩来\n小心驶得千年渡\n莫让浮云蔽日开',
      en: 'At midnight, the wind sounds like crying cranes —\nA boat in shallow water fears the rapids —\nCaution can steer a thousand crossings safely —\nDon\'t let drifting clouds obscure the sun.'
    },
    interpretation: {
      zh: '此签主有惊无险，但需谨慎行事。前方有暗礁，小心即可安然渡过。勿冲动。',
      en: 'Dangers are real but avoidable with care. Hidden obstacles lie ahead — navigate cautiously and you\'ll pass through safely. Don\'t be rash.'
    },
    domain: 'general',
    domainGuidance: {
      zh: '近期凡事三思而行。特别小心合同、文件、借贷之事。过了这个月会好转。',
      en: 'Think carefully before any action. Be especially cautious with contracts, documents, and loans. Conditions improve after this month.'
    }
  },
  {
    id: 80,
    tier: '下',
    tierEn: 'Cautionary Fortune',
    poem: {
      zh: '独行山路遇云深\n雾锁前峰不见人\n莫道迷途无出路\n回身一步是平津',
      en: 'Alone you walk the mountain path, clouds deepen —\nFog locks the peaks ahead, no soul in sight —\nDon\'t say the lost have no way out —\nOne step back, and you\'ll find level ground.'
    },
    interpretation: {
      zh: '此签主暂时受困，但退一步海阔天空。当前方向可能不对，换个思路即可。',
      en: 'You\'re temporarily stuck, but stepping back reveals a wider view. Your current direction may be wrong — try a different approach.'
    },
    domain: 'career',
    domainGuidance: {
      zh: '工作中可能走错了方向。不要固执，及早调整策略。听取同事意见。',
      en: 'You may be on the wrong track at work. Don\'t be stubborn — adjust your strategy early. Listen to colleagues.'
    }
  },
  {
    id: 85,
    tier: '下',
    tierEn: 'Cautionary Fortune',
    poem: {
      zh: '落花有意随流水\n流水无情恋落花\n世事如棋局局变\n何须强求镜里花',
      en: 'Falling petals wish to follow running water —\nBut water has no heart for fallen flowers —\nThe world\'s affairs shift like a chess game —\nWhy chase flowers in a mirror?'
    },
    interpretation: {
      zh: '此签主单相思或一厢情愿。你想要的未必属于你。强求无益，放下才能解脱。',
      en: 'A one-sided attachment. What you want may not be meant for you. Forcing it won\'t help — letting go brings freedom.'
    },
    domain: 'love',
    domainGuidance: {
      zh: '这可能是一段不对等的关系。静下心来思考是否值得。真正的缘分不需要强求。',
      en: 'This may be an unbalanced relationship. Reflect calmly on whether it\'s worth it. True love never needs to be forced.'
    }
  },
  {
    id: 90,
    tier: '下',
    tierEn: 'Cautionary Fortune',
    poem: {
      zh: '大厦将倾一木何\n独力难支可奈何\n不如暂退观形势\n蓄力重来再着戈',
      en: 'One pillar cannot prop a falling tower —\nAlone you strain, but what can one hand do? —\nBetter to retreat and watch the shape of things —\nGather your strength and try again renewed.'
    },
    interpretation: {
      zh: '此签主力不从心。你承担了过多责任。暂时退让并非失败，而是策略性的重整。',
      en: 'You\'re stretched beyond your capacity. You\'ve taken on too much. Stepping back temporarily isn\'t failure — it\'s strategic regrouping.'
    },
    domain: 'health',
    domainGuidance: {
      zh: '注意过劳和压力。身体已发出警告信号。减少工作量，多休息，寻求帮助。',
      en: 'Watch for burnout and stress overload. Your body is sending warning signals. Reduce workload, rest more, ask for help.'
    }
  },

  /* ================================================================
     下下签 (Ill Fortune) — Lots 91-100
     ================================================================ */
  {
    id: 91,
    tier: '下下',
    tierEn: 'Ill Fortune',
    poem: {
      zh: '风卷残云月不明\n雷鸣电闪夜狰狞\n千山万水皆昏暗\n唯有心灯一点莹',
      en: 'Wind tears the clouds, the moon is dark —\nThunder cracks, lightning rends a dreadful night —\nA thousand hills, ten thousand streams, all black —\nOnly the heart\'s small lamp still glimmers bright.'
    },
    interpretation: {
      zh: '此签主大难临头，但只要心中有一盏明灯，就能渡过难关。黑暗终将过去。请坚信。',
      en: 'A great trial approaches, but as long as you keep one lamp lit in your heart, you will pass through. The darkness will end. Hold fast to hope.'
    },
    domain: 'general',
    domainGuidance: {
      zh: '眼前的困难可能会持续一段时间。不要独自面对，向亲友寻求支持。熬过去就是黎明。',
      en: 'These difficulties may persist for a while. Don\'t face them alone — seek support from friends and family. Endure, and dawn will come.'
    }
  },
  {
    id: 95,
    tier: '下下',
    tierEn: 'Ill Fortune',
    poem: {
      zh: '船到江心遇飓风\n进退两难四顾空\n若有善缘曾相结\n贵人一桨渡西东',
      en: 'Mid-river, your boat meets a hurricane —\nNo way forward or back, all directions bare —\nBut if you\'ve planted seeds of kindness —\nA noble friend will row you through the storm.'
    },
    interpretation: {
      zh: '此签主突遭变故，进退两难。但若你平日积德行善，此时必有人出手相助。反省过往。',
      en: 'Sudden crisis leaves you trapped. But if you\'ve been kind to others, someone will step in to help. Reflect on your past deeds.'
    },
    domain: 'career',
    domainGuidance: {
      zh: '工作中可能突遇重大打击。但过去的善缘会在关键时刻帮你。不要失去信心。',
      en: 'A severe blow may strike at work. But past goodwill will save you at the critical moment. Don\'t lose faith.'
    }
  },
  {
    id: 98,
    tier: '下下',
    tierEn: 'Ill Fortune',
    poem: {
      zh: '破镜难圆水难收\n往事如烟莫再求\n前程自有新天地\n何必回头望旧楼',
      en: 'A broken mirror cannot be mended whole —\nSpilled water can\'t be gathered back again —\nThe past is smoke — don\'t chase it anymore —\nNew horizons wait — why turn back to old towers?'
    },
    interpretation: {
      zh: '此签主不可挽回的失去。执着于过去只会徒增痛苦。放手，前方有新的人生。',
      en: 'An irreparable loss. Clinging to the past only adds to suffering. Let go — a new chapter of life awaits ahead.'
    },
    domain: 'love',
    domainGuidance: {
      zh: '这段关系已经结束，破镜难重圆。与其痛苦纠缠，不如潇洒离开。时间会治愈一切。',
      en: 'This relationship is over — a broken mirror cannot be restored. Rather than suffering in entanglement, leave with grace. Time heals all.'
    }
  },
  {
    id: 100,
    tier: '下下',
    tierEn: 'Ill Fortune',
    poem: {
      zh: '千里黄云白日曛\n北风吹雁雪纷纷\n莫愁前路无知己\n天下谁人不识君',
      en: 'A thousand miles of yellow clouds, the sun turned gray —\nThe north wind drives wild geese, the snow swirls down —\nDon\'t grieve that no friend waits on the road ahead —\nWho beneath heaven doesn\'t know your name?'
    },
    interpretation: {
      zh: '此签虽是下下签，但暗含转机。前路虽难，但你的名声和能力终将带你走出困境。相信自己。',
      en: 'Though this is an ill-fortune lot, it contains a hidden turn. The road is hard, but your reputation and capability will carry you through. Believe in yourself.'
    },
    domain: 'general',
    domainGuidance: {
      zh: '这是黎明前最黑暗的时刻。你比自己想象的更强大。坚持你的信念，转机就在不远处。',
      en: 'This is the darkest hour before dawn. You are stronger than you know. Hold to your convictions — the turnaround is near.'
    }
  }
];

/* ================================================================
   Deity Message Registry
   Each deity × 5 tiers × 2-3 messages. Random one chosen on draw.
   ================================================================ */
var DEITY_DIVINATION_MESSAGES = {
  'sun-wukong': {
    '上上': [
      { zh: '俺老孙火眼金睛，一看便知你是大吉之命！今日这签，连玉帝看了都要点头。尽管放手去干！', en: 'Old Sun\'s fiery eyes see it clear — you\'re destined for greatness! Even the Jade Emperor would nod at this lot. Go boldly!' },
      { zh: '好签！好签！俺老孙闹天宫时都没今日这般高兴。你且记着：天不怕地不怕，就怕自己先趴下。', en: 'Fine lot! Fine lot! Old Sun wasn\'t this happy even during Havoc in Heaven. Remember: fear nothing but your own surrender.' }
    ],
    '上': [
      { zh: '不错不错，花果山的桃子都没你这福气甜。继续走你的路，俺老孙给你开路！', en: 'Not bad at all — even Flower-Fruit Mountain peaches aren\'t as sweet as your fortune. Walk your path — Old Sun clears the way!' },
      { zh: '七十二变是俺的看家本事，随机应变是你的天赋。这签告诉俺：你行！', en: 'Seventy-two transformations are my art; adapting is yours. This lot tells old Sun: you\'ve got this!' }
    ],
    '中': [
      { zh: '不急不急，当年俺在五行山下压了五百年都没急。好事多磨，耐心等着就是。', en: 'Easy, easy — I endured five centuries under a mountain. Good things take time. Just be patient.' },
      { zh: '中签也是签，平平淡淡才是真。俺老孙闹够了才知道：安稳日子最难得。', en: 'A neutral lot is still a lot. Peace is the truest treasure. Took Old Sun a lot of havoc to learn that one.' }
    ],
    '下': [
      { zh: '嘿，这签嘛……不太妙。不过俺老孙在天庭闹过，地府改过生死簿，劝你一句：没有过不去的坎！', en: 'Hmph, this lot isn\'t great. But I\'ve razed heaven and rewritten the Book of Life and Death. Take it from me: no mountain is too high.' },
      { zh: '这签让俺想起被压五行山的日子。但你看——五百年后，俺还是齐天大圣！你也一样。', en: 'This lot reminds me of being under that mountain. But look — five centuries later, I\'m still the Great Sage! So will you rise again.' }
    ],
    '下下': [
      { zh: '呜呼！这签比俺老孙被念紧箍咒还难受。但你听着：最黑的夜过去就是天明，俺老孙从不骗人！', en: 'Oof! This lot stings worse than the Headband Sutra. But listen: the darkest night gives way to dawn. Old Sun never lies!' },
      { zh: '下下签又怎样？当年生死簿上说俺阳寿已尽，俺一笔勾了！你也能改写自己的命。', en: 'Ill fortune? So what? The Book of Life said I was done — I crossed it out and wrote my own fate. You can too.' }
    ]
  },
  'nezha': {
    '上上': [
      { zh: '风火轮为你开路！本太子看得出，你命中带火——那种烧尽一切障碍的烈火。勇往直前！', en: 'The Wind-Fire Wheels pave your way! This prince sees it: you carry fire in your fate — the kind that burns every obstacle to ash. Charge forward!' },
      { zh: '三头六臂是本事，一心一意是修为。你的上上签证明：你既不缺本事，也不缺修为。', en: 'Three heads and six arms speak of skill; a focused heart speaks of character. Your supreme lot proves you have both.' }
    ],
    '上': [
      { zh: '乾坤圈护着你呢。路虽有波折，但最后必定平安。本太子最喜欢你这样勇敢的人。', en: 'The Universe Ring guards you. Though the road may wind, you\'ll arrive safe. This prince admires the brave like you.' },
      { zh: '好签！混天绫为你遮风挡雨。记住：没有人能打倒一个不肯倒下的人。', en: 'Good lot! The Red Armillary Sash shields you from every storm. Remember: no one can defeat someone who refuses to fall.' }
    ],
    '中': [
      { zh: '莲花化身要在污泥中生长。你现在就在那污泥里——别急，花开的时候自会出来。', en: 'The lotus body grows from mud. You\'re in the mud right now — don\'t rush. When the bloom opens, you\'ll rise free.' },
      { zh: '不惊不怖，不怒不怨。你眼前的困局，本太子当年也经历过。守心即是胜。', en: 'No fear, no anger, no resentment. I\'ve faced what you face now. Guard your heart — that\'s victory enough.' }
    ],
    '下': [
      { zh: '火尖枪也有刺不穿的东西。但你记住哪吒的话：真正的敌人从来不在外面，在你的恐惧里。', en: 'Even the Fire-Tipped Spear can\'t pierce everything. But hear Nezha: the real enemy was never outside — it lives in your fear.' },
      { zh: '这签……本太子不喜欢。但你知道我当年怎么打败四海龙王的吗？不是靠硬拼，是靠不怕死。', en: 'This lot... this prince doesn\'t like it. But you know how I defeated the Four Dragon Kings? Not by force — by not fearing death.' }
    ],
    '下下': [
      { zh: '我当年割肉还母、剔骨还父时，也以为天塌了。但你看——莲花重塑，我比以前更强。毁灭是新生的开始。', en: 'When I returned my flesh to my mother and bones to my father, I thought the sky had fallen. But look — the lotus remade me stronger. Destruction is rebirth\'s beginning.' },
      { zh: '这签比剔骨还痛，本太子懂。但你若是真金，烈火炼过之后只会更纯。咬牙撑住。', en: 'This lot hurts more than carving out bone — this prince understands. But if you\'re true gold, the fire only refines you. Grit your teeth and endure.' }
    ]
  },
  'zhu-bajie': {
    '上上': [
      { zh: '哎呦！好签啊好签！俺老猪做梦都想抽到这种签！你呀，比高老庄的高小姐还有福气！', en: 'Aiyo! What a lot! Old Pig dreams of drawing such a lot! You\'re more blessed than Lady Gao of Gao Village!' },
      { zh: '俺老猪没啥文化，但这签的意思俺懂——就是三个字：吃好、睡好、一切都好！', en: 'Old Pig ain\'t educated, but I know what this lot means — three simple words: eat well, sleep well, all\'s well!' }
    ],
    '上': [
      { zh: '不错不错！俺老猪取经路上都没这么顺过。你这福气啊，是上辈子修来的。', en: 'Good, good! Even on the pilgrimage Old Pig didn\'t have it this smooth. Your blessings were earned in a past life.' },
      { zh: '俺老猪最爱说：人生在世，吃喝二字。但有福之人不光会吃，还会感恩。你就是那有福之人。', en: 'Old Pig always says: life is about eating and drinking. But the truly blessed know gratitude too. You\'re one of them.' }
    ],
    '中': [
      { zh: '中签啊……就像俺老猪在高老庄的日子——不好不坏，平平淡淡。但平淡也是福，你说是吧？', en: 'A neutral lot... it\'s like Old Pig\'s days in Gao Village — not great, not bad. But peace is its own blessing, isn\'t it?' },
      { zh: '俺师傅常说：一切随缘。中签就是告诉你：别急，缘分还没到呢。先吃个包子垫垫。', en: 'My master always said: let things follow their nature. This lot says: don\'t rush, the time isn\'t here yet. Have a bun while you wait.' }
    ],
    '下': [
      { zh: '呜……这签不太好看啊。不过俺老猪丑归丑，取经还是走完了。你也能走完你的路。', en: 'Hmph... this lot ain\'t pretty. But Old Pig\'s ugly and still finished the pilgrimage. You\'ll finish your journey too.' },
      { zh: '俺老猪最怕师父念紧箍咒——哦不对那是猴子的。总之呢，难关是会过去的。俺保证。', en: 'Old Pig\'s worst fear is the Headband Sutra — wait no, that\'s the monkey\'s. Anyway: hard times pass. I promise.' }
    ],
    '下下': [
      { zh: '哎呀呀……这签看着比俺老猪的脸还难看！但是！俺老猪都能成佛，你还有什么不可能的？', en: 'Aiyah... this lot looks worse than Old Pig\'s face! BUT! If Old Pig can become a Buddha, what\'s impossible for you?' },
      { zh: '下下签……让俺想起被贬下凡那天。惨啊，真惨。但你看，俺现在不是好好的？你也行的。', en: 'An ill lot... reminds me of being banished from heaven. Miserable, truly miserable. But look — I\'m fine now. You\'ll be too.' }
    ]
  },
  'buddha': {
    '上上': [
      { zh: '阿弥陀佛。此签乃万中无一的吉兆，是累世善因成熟的果报。善哉善哉。', en: 'Amitabha. This lot is a blessing of one in ten thousand — the ripened fruit of good seeds sown across many lifetimes. Excellent, excellent.' },
      { zh: '一花一世界，一叶一菩提。你的世界此刻光明圆满，你的菩提即将开花。', en: 'A flower holds a world, a leaf holds enlightenment. Your world is luminous and whole now; your bodhi is about to bloom.' }
    ],
    '上': [
      { zh: '万法皆空，因果不空。此签说明你种下的善因正在生长。继续走你的正道。', en: 'All phenomena are empty, but cause and effect are real. This lot shows your good causes are growing. Continue on the right path.' },
      { zh: '你心中有佛，佛便在你身边。此签是给你信心的——你并不孤单。', en: 'When Buddha dwells in your heart, Buddha walks beside you. This lot gives you confidence — you are not alone.' }
    ],
    '中': [
      { zh: '放下即是解脱。你现在的不安，是因为抓得太紧。松开手，才能接住新的礼物。', en: 'Letting go is liberation. Your unease comes from gripping too tightly. Open your hands — only then can you receive new gifts.' },
      { zh: '菩提本无树，明镜亦非台。本来无一物，何处惹尘埃。你的烦恼都是自己造作的。放下吧。', en: 'No tree of wisdom, no stand for the mirror. Originally there is nothing — where can dust alight? Your troubles are self-made. Let them go.' }
    ],
    '下': [
      { zh: '苦海无边，回头是岸。此签是在提醒你：你走的方向可能不对。转个方向即是光明。', en: 'The sea of suffering has no shore — but turn back, and the shore is right there. This lot warns: your direction may be wrong. Turn toward the light.' },
      { zh: '诸行无常，是生灭法。你眼前的困苦，和你曾经的快乐一样，都是暂时的。', en: 'All conditioned things are impermanent. Your current suffering, like your past joys, is temporary.' }
    ],
    '下下': [
      { zh: '我不入地狱，谁入地狱。地藏菩萨此言，说尽了苦厄的意义。你的苦难，是在替众生承担。这是大功德。', en: '"If I don\'t enter hell, who will?" Kṣitigarbha\'s words reveal the meaning of suffering. Your hardship is borne for all beings — this is great merit.' },
      { zh: '大千世界，不过一念。你现在看到的黑暗，也不过是一个念头。转变心念，即是转变命运。', en: 'The cosmos is but a single thought. The darkness you see now is also just a thought. Change your thought, and you change your destiny.' }
    ]
  },
  'guanyin': {
    '上上': [
      { zh: '净瓶甘露洒向你的心田。慈悲的观世音告诉你：你所求的，我都听见了。安心等待。', en: 'Sweet dew from the pure vase sprinkles your heart. Compassionate Guanyin tells you: I have heard every prayer. Rest and wait.' },
      { zh: '千处祈求千处应。观音菩萨从未离你而去。此签是给你最温柔的承诺。', en: 'She answers every prayer, everywhere. Guanyin has never left your side. This lot is her gentlest promise to you.' }
    ],
    '上': [
      { zh: '杨枝甘露，滴滴润心。你所经历的，观音都看在眼里。她在为你铺一条平坦的路。', en: 'Each drop from the willow branch nourishes your heart. Guanyin sees all you\'ve endured. She is paving a smooth road for you.' },
      { zh: '大慈大悲，有求必应。你心里的话，观音已经知道了。她会以最温柔的方式回应你。', en: 'Great mercy, great compassion — every prayer is answered. Guanyin already knows what\'s in your heart. She\'ll respond in the gentlest way.' }
    ],
    '中': [
      { zh: '莲花出淤泥而不染。你现在就在那个"淤泥"里——不是惩罚，是修行。', en: 'The lotus rises from mud, unstained. You\'re in that mud right now — not as punishment, but as practice.' },
      { zh: '心静自然凉。你心中波涛汹涌不是外面的风浪大，是你心里有风浪。先静心。', en: 'A calm heart stays cool. The turbulence you feel isn\'t from outside waves — it\'s the waves within. Calm your heart first.' }
    ],
    '下': [
      { zh: '苦海常作渡人舟。观音的船就在岸边，就看你愿不愿意上去了。有时候，求救也是一种勇气。', en: 'In the sea of suffering, the ferry boat is always there. Guanyin\'s boat waits at the shore — you just need to step aboard. Sometimes, asking for help is the bravest act.' },
      { zh: '净水洗心尘。你眼前的不顺，是心灵积尘太久。借这个机会清扫一下吧。', en: 'Pure water cleanses the heart\'s dust. These troubles are a sign that your spirit needs cleaning. Use this chance to clear it out.' }
    ],
    '下下': [
      { zh: '众生皆苦，观音尤怜。你的痛苦她看得最清楚。手持净瓶，她正将甘露洒向你。请感受到这份温暖。', en: 'All beings suffer, and Guanyin mourns each one. She sees your pain clearest. Vase in hand, she is sprinkling sweet dew toward you now. Feel this warmth.' },
      { zh: '在最深的黑暗里，观音的千手千眼离你最近。你不是被抛弃的——你正在被最温柔地照看着。', en: 'In the deepest darkness, Guanyin\'s thousand hands and eyes are closest to you. You are not abandoned — you are being watched over, most tenderly.' }
    ]
  },
  'erlang-shen': {
    '上上': [
      { zh: '天眼已开，真假立辨。此签告诉你：你正走在正确的路上，任何谎言都无法蒙蔽你。', en: 'The Heavenly Eye is open — truth and falsehood are clear. This lot tells you: you walk the right path, and no deception can blind you.' },
      { zh: '三尖两刃刀镇守四方。有二郎神在，谁敢阻你？所向披靡，万夫莫敌！', en: 'The three-pointed spear guards all directions. With Erlang Shen at your back, who dares block you? Invincible and unstoppable!' }
    ],
    '上': [
      { zh: '七十二变化，应变无穷。你有灵活应变的智慧。遇到什么情况，就能变成什么样子。', en: 'Seventy-two transformations, infinite resource. You have the wisdom to adapt. Whatever you face, you can become what\'s needed.' },
      { zh: '灌江口上自在为王。此签说：你不需要任何人认可，你就是你自己的王。', en: 'At Guanjiangkou, answerable to no one. This lot says: you need no one\'s approval. You are your own sovereign.' }
    ],
    '中': [
      { zh: '天眼看得远，但脚下的路还要一步一步走。别老看远处的山，先跨过眼前这道坎。', en: 'The Heavenly Eye sees far, but the road is walked step by step. Don\'t stare at distant mountains — first cross the hurdle right in front of you.' },
      { zh: '啸天犬从不离开主人半步。你身边也有这样的忠诚者——留意那些一直陪着你的人。', en: 'The Sky-Howling Hound never leaves its master\'s side. You have loyal ones like this around you — notice those who have always been there.' }
    ],
    '下': [
      { zh: '就算天眼也有看走眼的时候。这签提醒你：你可能被表面现象迷惑了。再仔细看看。', en: 'Even the Heavenly Eye can miss something. This lot reminds you: you may be deceived by surface appearances. Look again, more carefully.' },
      { zh: '二郎神打仗从不蛮干。你现在缺的不是勇气，是策略。停下来，盘算一下，再出手。', en: 'Erlang Shen never fights recklessly. What you lack now isn\'t courage — it\'s strategy. Pause, calculate, then strike.' }
    ],
    '下下': [
      { zh: '我曾与孙悟空大战三百回合不分胜负。大战之后是疲惫——你现在就是这样。但休息之后，力量会回来。', en: 'I fought Sun Wukong three hundred rounds to a draw. After great battle comes great weariness — that\'s where you are now. But after rest, strength returns.' },
      { zh: '天眼所见，也有无法改变之事。但接受不等于放弃。知道什么是你能改变的，什么是你必须承受的。', en: 'Some things even the Heavenly Eye sees cannot be changed. But acceptance is not surrender. Know what you can change, and what you must endure.' }
    ]
  },
  'tang-sanzang': {
    '上上': [
      { zh: '阿弥陀佛！贫僧一路西行，深知好缘分的珍贵。此签是佛祖给你的嘉许。善哉！', en: 'Amitabha! This humble monk knows the value of good fortune after a long pilgrimage. This lot is the Buddha\'s praise for you. Excellent!' },
      { zh: '心诚则灵，路遥知力。贫僧看此签便知：你有一颗金子般的心，所愿必成。', en: 'Sincerity moves heaven; distance proves strength. This monk can tell from this lot: your heart is gold, and your wish will be fulfilled.' }
    ],
    '上': [
      { zh: '九九八十一难皆为空。贫僧经历的每一难，都是通往西天的台阶。你的波折也是。', en: 'Eighty-one trials, each one empty of harm. Every trial this monk endured was a step toward the Western Paradise. Your setbacks are the same.' },
      { zh: '若不至天竺，终不东归一步。此签赞你的坚持。你心中的志向，比任何苦难都强大。', en: '"Not one step east until I reach India." This lot praises your resolve. The aspiration in your heart is stronger than any suffering.' }
    ],
    '中': [
      { zh: '贫僧在取经路上悟出一个道理：不急不躁，才是真正的智慧。你现在需要的，是耐心。', en: 'On the pilgrimage, this monk learned one truth: patience is the truest wisdom. What you need now is patience.' },
      { zh: '佛光普照，但不是在你想要的时候，而是在你需要的时候。相信缘分的安排。', en: 'The Buddha\'s light shines — not when you want it, but when you need it. Trust in the arrangement of fate.' }
    ],
    '下': [
      { zh: '贫僧曾被妖魔抓去无数次。每次都觉得要死了——但每次都有徒弟来救。你的"徒弟"也在路上了。', en: 'This monk was captured by demons countless times. Each time I thought I would die — but each time, my disciples came. Your "disciples" are on their way too.' },
      { zh: '出家人不打诳语：这签确实不太妙。但贫僧遇到过更糟的——都过来了。你也能。', en: 'A monk speaks only truth: this lot is indeed troubling. But this monk has faced worse — and survived. You will too.' }
    ],
    '下下': [
      { zh: '贫僧最绝望的时候，不是妖魔当前，而是徒弟离散。但你知道吗？孙悟空每一次都回来了。爱你的人也会回来。', en: 'This monk\'s darkest moments weren\'t facing demons — they were when my disciples scattered. But Wukong always returned. Those who love you will return too.' },
      { zh: '下下签……让贫僧想起被白骨精欺骗的那段路。被骗不可怕，可怕的是不再相信。请继续保持你的善良。', en: 'An ill lot... reminds this monk of being deceived by the White Bone Spirit. Being fooled isn\'t terrible — what\'s terrible is losing faith. Please, keep your kindness.' }
    ]
  },
  'jade-emperor': {
    '上上': [
      { zh: '朕执掌天界无量劫，见惯因果。此签乃天意垂青，万中无一。你的命格，连朕都为之侧目。', en: 'I have ruled the celestial realm for countless eons. This lot is Heaven\'s favor — one in ten thousand. Even I take note of your destiny.' },
      { zh: '天庭之上，朕说了算。今日这签，朕亲自批下：大吉大利，百无禁忌！', en: 'In the celestial court, my word is law. This lot, I personally approve: supreme fortune, all taboos lifted!' }
    ],
    '上': [
      { zh: '朕见过无数求签之人，你是少数让朕点头的。继续前行，天庭会为你铺路。', en: 'I have seen countless petitioners, and you are among the few who earn my nod. Continue — the celestial court will pave your way.' },
      { zh: '瑶池金母的蟠桃，三千年一熟。你等得起，就等得到最好的。此签说：值得等。', en: 'The Queen Mother\'s peaches ripen once in three thousand years. If you can wait, the finest fruit is yours. This lot says: it\'s worth the wait.' }
    ],
    '中': [
      { zh: '天意难测，朕也曾在劫数中历练。你现在的不确定，是天道给你的功课。好好完成它。', en: 'Heaven\'s will is hard to fathom — even I have faced tribulations. Your uncertainty now is a lesson from the Dao. Complete it well.' },
      { zh: '天庭的官僚体系你该了解：好事多磨。你的事朕收到了，正在走流程。耐心。', en: 'You should know the celestial bureaucracy: good things take paperwork. I\'ve received your case — it\'s being processed. Patience.' }
    ],
    '下': [
      { zh: '这签……朕的太白金星会给你一些建议。你最近的运势确实低迷，但天界从不放弃任何一个凡人。', en: 'This lot... my Grand White Venus will offer you counsel. Your recent fortune is indeed low, but the celestial realm never abandons any mortal.' },
      { zh: '朕曾见孙悟空大闹天宫——那才叫劫难。你这点波折，在天界档案里连"小风波"都算不上。', en: 'I witnessed Sun Wukong\'s Havoc in Heaven — now THAT was a disaster. Your troubles... in the celestial archives, they barely qualify as "minor incident."' }
    ],
    '下下': [
      { zh: '朕治下的三界，没有永恒的黑暗。你此刻的苦厄，是天条运转的一环——虽然你未必能理解其中深意。', en: 'In the Three Realms under my rule, there is no eternal darkness. Your current suffering is part of the celestial order — even if its deeper meaning eludes you now.' },
      { zh: '即便玉帝，也曾历经一亿三千二百劫方能登位。你的苦难，或许正是你日后成大器的资粮。', en: 'Even the Jade Emperor endured 132,000 tribulations before ascending. Your suffering may be the very fuel that forges your greatness.' }
    ]
  },
  'taishang-laojun': {
    '上上': [
      { zh: '八卦炉中炼就火眼金睛。你命中带火，是炼丹的上好材料。天意要你——成就不凡。', en: 'In the Eight Trigrams Furnace, the fiery eyes were forged. You carry fire in your fate — prime material for alchemy. Heaven intends you for greatness.' },
      { zh: '老道炼了万年丹，一眼看出：你是仙丹命。大吉大利，福寿绵长。', en: 'This old master has refined elixirs for ten thousand years. I can tell at a glance: you have the fate of an immortal pill. Boundless blessing and long life.' }
    ],
    '上': [
      { zh: '金丹九转方成。你现在在第三转——还有火候要熬，但方向是对的。', en: 'The golden elixir needs nine refinements. You\'re at the third — there\'s still fire to endure, but the direction is correct.' },
      { zh: '道法自然。这签告诉你：顺其自然就是最好的策略。不要逆天而行。', en: 'The Dao follows nature. This lot tells you: follow nature\'s course, and that is the best strategy. Don\'t swim against heaven\'s current.' }
    ],
    '中': [
      { zh: '炼丹最忌急躁。火候不到，再好的材料也成不了丹。你现在缺的就是一点耐心。', en: 'The greatest taboo in alchemy is impatience. Without proper heat, even the finest ingredients won\'t form a pill. What you lack is just a little patience.' },
      { zh: '无为之法，乃大道之宗。你越想控制，越控制不住。放手，反而得道。', en: 'The way of non-action is the source of the Great Dao. The more you try to control, the less you can. Let go — and you attain the Way.' }
    ],
    '下': [
      { zh: '这签杂气太重，需要淬炼。你周围的环境不太纯净——远离小人，清净修为。', en: 'This lot has too many impurities — it needs refinement. Your environment is not clean — distance yourself from small-minded people and purify your practice.' },
      { zh: '炼丹失败了可以重来。老道炼丹失败了不下万次。你的挫折不过是又一次试验。', en: 'A failed elixir can be remade. This old master has failed ten thousand times. Your setback is just another experiment.' }
    ],
    '下下': [
      { zh: '孙悟空当年踢翻了我的八卦炉——那可是天大的祸事。但也因此，世间才有了火焰山，有了新的地貌。毁灭即创造。', en: 'When Sun Wukong kicked over my Eight Trigrams Furnace — that was a catastrophe. But from it came Flaming Mountain, and new landscapes. Destruction is creation.' },
      { zh: '这签是块顽石。但顽石之中，往往藏着最好的玉。老道不认为你已到绝路。', en: 'This lot is a stubborn stone. But within stubborn stones often hides the finest jade. This old master does not believe you\'ve reached a dead end.' }
    ]
  },
  'guanyu': {
    '上上': [
      { zh: '青龙偃月刀为你开路！关某一生最重忠义——你心中有忠义，天必佑之。', en: 'The Green Dragon Crescent Blade cleaves your path! Guan Yu values loyalty above all — you carry loyalty in your heart, and Heaven must bless it.' },
      { zh: '过五关斩六将，关某靠的就是一往无前。这签告诉你：勇者无畏，勇者无敌。', en: 'Through five passes, I slew six generals — by charging forward without looking back. This lot tells you: the brave fear nothing; the brave are invincible.' }
    ],
    '上': [
      { zh: '千里走单骑，护送嫂嫂归。你的信义，天地可鉴。这签是对你品德的肯定。', en: 'A thousand miles alone, escorting my sister-in-law home. Your integrity is witnessed by heaven and earth. This lot affirms your character.' },
      { zh: '关某在华容道放走曹操——不是打不过，是讲义气。有时候，放过别人就是放过自己。', en: 'I released Cao Cao at Huarong Trail — not because I couldn\'t defeat him, but for honor. Sometimes, letting others go is letting yourself go free.' }
    ],
    '中': [
      { zh: '关某也有走麦城的时候。英雄也有落难日，这不是耻辱——这是每个人都必须经历的修行。', en: 'Even Guan Yu had his defeat at Maicheng. Even heroes fall — this isn\'t shame. It\'s a practice every person must undergo.' },
      { zh: '荆州之失，缘于轻敌。这签提醒你：不要高估自己，也不要低估对手。', en: 'Jingzhou was lost through underestimating the enemy. This lot warns: don\'t overestimate yourself, nor underestimate your opponent.' }
    ],
    '下': [
      { zh: '关某一生无惧，但有遗恨。此签说：你可能正面对一个让你动摇的时刻。站稳了，别倒。', en: 'Guan Yu feared nothing in life, but had regrets. This lot says: you may be facing a moment that shakes you. Stand firm — don\'t fall.' },
      { zh: '败走麦城时，关某的赤兔马都没能带他脱困。但你看后世——关某成了帝君，千秋万代受人敬仰。败不是终。', en: 'When I fled Maicheng, even Red Hare couldn\'t carry me to safety. But look — I became an Emperor God, revered through the ages. Defeat is not the end.' }
    ],
    '下下': [
      { zh: '关某被吕蒙所擒时，想到的不是死，是没能完成桃园结义的誓约。你的苦难背后，一定有什么你最在乎的东西。守护它。', en: 'When Lü Meng captured me, I thought not of death, but of the unfinished oath of the Peach Garden. Behind your suffering is something you deeply cherish. Protect it.' },
      { zh: '身首异处，忠魂不灭。关某死后封神——你看到的死路，可能是通往神坛的路。', en: 'Body and head separated, but my loyal soul endured. After death, I was enshrined as a god — what looks like a dead end may be the road to a shrine.' }
    ]
  },
  '_default': {
    '上上': [
      { zh: '天官赐福，百无禁忌。你今日所求，皆得上达天听。大吉大利！', en: 'The heavenly officials bestow their blessing — all taboos are lifted. Everything you seek today has reached the celestial ear. Supreme fortune!' },
      { zh: '祥云瑞气环绕你身。天意已定：你的运势正处在巅峰。抓住此刻！', en: 'Auspicious clouds and gentle vapors surround you. Heaven has decreed: your fortune is at its peak. Seize this moment!' }
    ],
    '上': [
      { zh: '紫气东来，好运将至。你走在正确的路上，天界在为你鼓掌。', en: 'Purple mist rises from the east — good fortune approaches. You walk the right path, and the celestial realm applauds.' },
      { zh: '星辰为你排列，风向因你改变。你的运势正在上升，一切向好。', en: 'The stars align for you; the wind changes direction for you. Your fortune is rising — all things turn for the better.' }
    ],
    '中': [
      { zh: '天道循环，有起有落。你现在在"平"的位置——不好不坏，正是积蓄力量的时候。', en: 'The Dao cycles — rise and fall. You\'re at the level point — neither good nor bad, the perfect moment to gather strength.' },
      { zh: '金石之言已达天听，但天界的回复需要时间。耐心等待即是修行。', en: 'Your golden words have reached the celestial realm, but heaven\'s reply takes time. Patient waiting is itself a practice.' }
    ],
    '下': [
      { zh: '天象有变，风云暗涌。但观星台上，朕看到云层之后仍有星光。黑暗不是永远。', en: 'The celestial signs shift — wind and cloud stir darkly. But from the star-gazing platform, I see starlight behind the clouds. Darkness is not forever.' },
      { zh: '此签如逆风航行。不是不能到达——是更费力一些。调整航向，不要硬顶。', en: 'This lot is like sailing into a headwind. Not impossible to reach harbor — just more effort needed. Adjust your heading; don\'t fight the wind directly.' }
    ],
    '下下': [
      { zh: '天有莫测风云。但这风这云，终将过去。你只需护好心中的烛火——那是最重要的东西。', en: 'Heaven has unpredictable storms. But these winds and clouds will pass. Protect the candle flame in your heart — that is the most important thing.' },
      { zh: '即便深渊，也有底部。到了底，剩下的路就是向上的。你现在可能就在那个底部。', en: 'Even the deepest abyss has a bottom. Once you reach it, the only way is up. You may be at that bottom now — which means you\'re about to rise.' }
    ]
  }
};

/* ================================================================
   Helper: pick a random deity message for a given deity + tier
   Returns { zh, en } object.
   ================================================================ */
function pickDeityMessage(deitySlug, tier) {
  var deityMessages = DEITY_DIVINATION_MESSAGES[deitySlug] || DEITY_DIVINATION_MESSAGES['_default'];
  var tierMessages = deityMessages[tier];
  if (!tierMessages || tierMessages.length === 0) {
    var defaultTier = DEITY_DIVINATION_MESSAGES['_default'][tier];
    if (defaultTier && defaultTier.length > 0) {
      return defaultTier[Math.floor(Math.random() * defaultTier.length)];
    }
    return { zh: '天机不可泄露。', en: 'The celestial secret cannot be revealed.' };
  }
  return tierMessages[Math.floor(Math.random() * tierMessages.length)];
}

/* ================================================================
   Helper: get fortune lot by ID (1-100)
   ================================================================ */
function getFortuneById(id) {
  for (var i = 0; i < DIVINATION_LOTS.length; i++) {
    if (DIVINATION_LOTS[i].id === id) return DIVINATION_LOTS[i];
  }
  return DIVINATION_LOTS[0];
}
