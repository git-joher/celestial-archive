/**
 * Mythical Beast Collection — Beast Registry
 * 20 mythical creatures from Chinese mythology with riddles, lore, and stats.
 * Each beast has full bilingual (zh + en) content for the collection game.
 */

var MYTHICAL_BEASTS = [
  /* ================================================================
     KUNLUN (4 beasts)
     ================================================================ */
  {
    id: 'qilin',
    name: { zh: '麒麟', en: 'Qilin' },
    type: '麒麟',
    rarity: '仙',
    region: 'kunlun',
    stats: { power: 70, wisdom: 85, mystery: 80, ferocity: 35, benevolence: 95 },
    riddle: {
      zh: '麒麟踏云来，祥瑞照九州。\n仁义礼智信，五德俱内收。\n圣人出则见，盛世方显头。\n天地有正气，浩然万古流。',
      en: 'The Qilin trots upon clouds, auspicious light shines on all lands.\nBenevolence, righteousness, wisdom, honor, faith — all five virtues within.\nIt appears when a sage is born, shows itself only in golden times.\nHeaven and earth hold righteous qi, flowing majestic through the ages.'
    },
    lore: {
      zh: '麒麟是所有瑞兽中最仁慈者，只在明君治世时现身。它身似鹿、尾如牛、角独一，行走时不伤寸草。在中国神话中，麒麟与龙、凤、龟并称四灵，相传孔子诞生时曾有麒麟现世。',
      en: 'The Qilin is the most benevolent of all mythical beasts, appearing only during the reign of a wise ruler. With the body of a deer, the tail of an ox, and a single horn, it walks without harming so much as a blade of grass. In Chinese mythology, the Qilin is one of the Four Benevolent Animals alongside the Dragon, Phoenix, and Tortoise, and is said to have appeared at the birth of Confucius.'
    },
    encounterText: {
      zh: '祥云凝聚，金光四射，一头瑞兽从昆仑深处缓缓步出。它的鳞甲如碧玉般温润，每一步都踏出淡淡的光晕。空气中弥漫着奇异的芬芳，仿佛万物都为之安静下来。',
      en: 'Auspicious clouds converge, golden light radiates in all directions — a gentle beast steps forth from the depths of Kunlun. Its scales glow like warm jade, each step leaving a faint halo of light. The air fills with an ethereal fragrance, as if all of nature has fallen silent in reverence.'
    }
  },
  {
    id: 'white-tiger',
    name: { zh: '白虎', en: 'White Tiger' },
    type: '兽',
    rarity: '灵',
    region: 'kunlun',
    stats: { power: 90, wisdom: 55, mystery: 70, ferocity: 85, benevolence: 45 },
    riddle: {
      zh: '白虎西方金，肃杀秋气深。\n长啸动山岳，威风震古今。\n兵戈随身起，杀伐为其任。\n星宿参井度，寒气侵人襟。',
      en: 'The White Tiger of the West, metal-born, autumn\'s stern breath runs deep.\nA long roar shakes mountains, its might resounds through past and present.\nWeapons rise at its side, slaughter is its ordained task.\nAmong the constellations of Shen and Jing, its cold air pierces the soul.'
    },
    lore: {
      zh: '白虎是西方天界的守护神兽，掌管秋季与金行。其啸声动山岳，现身预示兵戈之威。作为四象之一，白虎代表西方星宿与收获征伐之季，既是威武的战神，也是驱邪镇煞的神灵。',
      en: 'The White Tiger is the celestial guardian of the West, ruling over autumn and the element of metal. Its roar shakes mountains and its presence signals the might of armies. As one of the Four Symbols, the White Tiger represents the western constellations and the season of harvest and warfare — both a fearsome warrior and a divine protector against evil forces.'
    },
    encounterText: {
      zh: '虎啸震天，狂风骤起。一道白色闪电掠过山峦，所过之处草木皆伏。白虎昂首立于岩石之上，一双金色眼眸审视着你，既是威吓，也是在衡量你的胆魄。',
      en: 'A tiger\'s roar splits the sky, a gale rises from nowhere. A streak of white lightning flashes across the peaks — grass and trees bow in its wake. The White Tiger stands tall upon a rock, its golden eyes examining you — both a threat and a measure of your courage.'
    }
  },
  {
    id: 'celestial-crane',
    name: { zh: '仙鹤', en: 'Celestial Crane' },
    type: '精',
    rarity: '凡',
    region: 'kunlun',
    stats: { power: 20, wisdom: 70, mystery: 65, ferocity: 10, benevolence: 75 },
    riddle: {
      zh: '仙鹤舞长空，清唳入九重。\n羽衣如白雪，丹顶似日红。\n千年栖松柏，万里乘长风。\n本是瑶池客，偶现凡尘中。',
      en: 'The celestial crane dances across the void, its pure call reaching the ninth heaven.\nPlumage white as driven snow, crimson crown bright as the sun.\nPerched on pines and cypress for a thousand years, riding the wind for ten thousand miles.\nBorn a guest of the Jade Pool, it seldom graces the mortal realm.'
    },
    lore: {
      zh: '仙鹤是仙界的信使，常载着得道者的灵魂飞升天界。它羽如白雪、顶似丹砂，在云间翩翩起舞。在道教神话中，仙鹤象征长寿与超脱，常伴随八仙云游四海，亦是南极仙翁的坐骑。',
      en: 'The Celestial Crane is a messenger of the immortals, often depicted carrying enlightened souls to the heavens. With snow-white feathers and a crimson crown, it dances gracefully among the clouds. In Daoist mythology, the crane symbolizes longevity and transcendence, often accompanying the Eight Immortals and serving as the mount of the Old Man of the South Pole.'
    },
    encounterText: {
      zh: '一声清越的鹤唳划破长空。抬头望去，一只通体雪白的仙鹤在云端盘旋，姿态优雅从容。它似乎并不畏惧你，反而缓缓降落，歪着脑袋打量着这位不速之客。',
      en: 'A clear, melodic crane call pierces the heavens. Looking up, a pure white crane circles among the clouds, its movements elegant and unhurried. It seems unafraid of you, instead descending slowly, tilting its head to study this unexpected visitor.'
    }
  },
  {
    id: 'dangkang',
    name: { zh: '当康', en: 'Dangkang' },
    type: '兽',
    rarity: '凡',
    region: 'kunlun',
    stats: { power: 40, wisdom: 30, mystery: 25, ferocity: 20, benevolence: 65 },
    riddle: {
      zh: '当康现丰年，其形似豚然。\n衔穗报嘉瑞，五谷满山川。\n春种秋收日，农夫笑开颜。\n太平盛世里，此兽降人间。',
      en: 'The Dangkang appears in bountiful years, its form like a boar.\nHolding rice stalks in its mouth it brings good omens — grain fills every hill and stream.\nWhen spring planting turns to autumn harvest, farmers smile with joy.\nIn times of peace and prosperity, this beast descends to the mortal world.'
    },
    lore: {
      zh: '当康是丰收的瑞兽，在粮食丰饶时从田间出现。它形似野猪但性情温顺，口中衔着稻穗，象征五谷丰登。古代《山海经》中记载，当康出现则天下大穰，农夫们在播种时节常祈盼能一睹此兽之颜。',
      en: 'The Dangkang is a harbinger of bountiful harvests, appearing from the fields when grain is plentiful. Resembling a wild boar but with a gentle disposition, it carries an ear of rice in its mouth as a sign of agricultural prosperity. Recorded in the ancient Classic of Mountains and Seas, the Dangkang heralds great harvests, and farmers would pray to glimpse this auspicious beast during planting season.'
    },
    encounterText: {
      zh: '麦田深处传来窸窣声响，一头形似野猪的瑞兽探出头来，口中衔着一束金灿灿的稻穗。它看到你并不逃窜，反而哼唧几声，像是在宣告又一个丰收年的到来。',
      en: 'A rustling sound comes from deep within the wheat field. A boar-like beast pokes its head out, holding a bundle of golden rice stalks in its mouth. It doesn\'t flee at the sight of you — instead it grunts softly, as if announcing yet another year of abundant harvest.'
    }
  },

  /* ================================================================
     SOUTH (3 beasts)
     ================================================================ */
  {
    id: 'nine-tailed-fox',
    name: { zh: '九尾狐', en: 'Nine-Tailed Fox' },
    type: '妖',
    rarity: '灵',
    region: 'south',
    stats: { power: 50, wisdom: 80, mystery: 90, ferocity: 55, benevolence: 30 },
    riddle: {
      zh: '九尾狐仙媚，青丘有灵根。\n修炼千年久，幻化百变身。\n妖娆惑君主，谗言乱乾坤。\n祸福本无定，人心自为神。',
      en: 'The nine-tailed fox, bewitching and divine, its spirit roots deep in Qingqiu.\nCultivating for a thousand years, transforming into a hundred forms.\nSeductive enough to sway emperors, its whispers chaos the realm.\nFortune and ruin have no fixed form — the human heart alone makes them divine.'
    },
    lore: {
      zh: '九尾狐是中国传说中最著名的精怪之一，以变幻之术与魅惑之力闻名。它源于神秘的青丘之山，每修炼百年方增一尾，九尾俱全则可通神。其中最传奇者当属妲己，以魅惑纣王之术倾覆了商朝江山。',
      en: 'The Nine-Tailed Fox is one of the most famous creatures in Chinese folklore, known for its shape-shifting abilities and seductive charm. Originating from the mystical Qingqiu Mountain, it is said that a fox gains an additional tail each century, and upon reaching nine tails, it achieves divine status. The most legendary of these is Daji, who brought down the Shang Dynasty through her enchantment of King Zhou.'
    },
    encounterText: {
      zh: '密林深处，一双琥珀色的眼睛在暗处闪烁。月光下，一道优雅的身影缓步走出，九条蓬松的尾巴如扇面般展开。它的美丽让人屏息，但那双含笑的眼眸深处，藏着千年的智慧与不可捉摸的意图。',
      en: 'Deep in the dense forest, a pair of amber eyes gleams in the shadows. Beneath the moonlight, an elegant figure steps forward, nine fluffy tails spreading like an open fan. Its beauty takes your breath away — but deep within those smiling eyes lie a thousand years of cunning and unfathomable intent.'
    }
  },
  {
    id: 'vermilion-bird',
    name: { zh: '朱雀', en: 'Vermilion Bird' },
    type: '凤',
    rarity: '仙',
    region: 'south',
    stats: { power: 85, wisdom: 60, mystery: 75, ferocity: 70, benevolence: 60 },
    riddle: {
      zh: '朱雀南方火，烈烈耀长空。\n七宿连珠现，炎精化赤虹。\n翅展焚万物，喙开吐炽风。\n夏至当空舞，光明照大东。',
      en: 'The Vermilion Bird of the South, flame, blazing bright across the endless sky.\nSeven mansions align like pearls, fire essence turns to crimson rainbows.\nIts wings unfold to burn all things, its beak opens to breathe scorching wind.\nDancing at the summer solstice, its radiance lights the great East.'
    },
    lore: {
      zh: '朱雀是南方守护神，化现火行之精、夏日之魂。其华羽如烈焰升腾，自地平线升起，为世间带来温暖与光明。作为四象之一，它掌管南方星宿，寓意繁荣、热情与太阳的生机之力，是四象中最为热烈的存在。',
      en: 'The Vermilion Bird is the guardian of the South, embodying the element of fire and the season of summer. Its brilliant plumage shines like flame as it rises from the horizon, bringing warmth and light to the world. As one of the Four Symbols, it watches over the southern constellations and embodies prosperity, passion, and the life-giving power of the sun — the most fervent of the four celestial guardians.'
    },
    encounterText: {
      zh: '天际泛起赤红色的霞光，一只巨大的火鸟展翅而来。它的每根羽毛都是一簇跳动的火焰，所过之处天空被染成金红色。热浪扑面而来，但你感受到的不是灼烧，而是一种古老而庄严的温暖。',
      en: 'The horizon blazes with crimson light — a colossal firebird approaches on outstretched wings. Each feather is a dancing flame; the sky is dyed gold and red in its wake. Waves of heat wash over you, yet what you feel is not searing pain but an ancient, solemn warmth.'
    }
  },
  {
    id: 'xingxing',
    name: { zh: '猩猩', en: 'Xingxing' },
    type: '兽',
    rarity: '凡',
    region: 'south',
    stats: { power: 60, wisdom: 40, mystery: 30, ferocity: 55, benevolence: 35 },
    riddle: {
      zh: '猩猩善言语，其形似猿猴。\n知人名与姓，嗜酒醉荒丘。\n双足能行路，长发覆额头。\n南方山林里，至今有遗俦。',
      en: 'The Xingxing knows human speech, its form like an ape.\nIt knows people\'s names and clans, loves wine, and drinks on wild hills.\nWalking upright on two legs, long hair covering its brow.\nIn the southern forests, its kin remain to this day.'
    },
    lore: {
      zh: '猩猩是一种奇特的猿状生物，出自南方丛林，以通人言、效人行著称。它酷爱饮酒，常诱使旅人对饮，醉倒后被猎人捕获。据《山海经》记载，猩猩能知人名，更有传说称其血可染红布料，染后永不褪色。',
      en: 'The Xingxing is a peculiar ape-like creature from the southern jungles, known for its ability to understand human speech and mimic human behavior. It has a particular fondness for wine and often tricks travelers into drinking contests, only to be captured by hunters when drunk. According to the Classic of Mountains and Seas, the Xingxing can recognize people by name, and its blood is said to dye fabric a crimson that never fades.'
    },
    encounterText: {
      zh: '树梢剧烈晃动，一个毛茸茸的身影荡了下来。它直立行走，浑身覆盖着深褐色的长毛，一脸好奇地凑近你。它咿咿呀呀地比划着，指了指远处的野果，又指了指自己的嘴——原来是想请你喝一杯。',
      en: 'The treetops shake violently as a furry figure swings down. It walks upright, covered in dark brown hair, and approaches you with undisguised curiosity. Chattering and gesturing animatedly, it points to wild fruit in the distance, then to its mouth — it\'s inviting you for a drink.'
    }
  },

  /* ================================================================
     WEST (3 beasts)
     ================================================================ */
  {
    id: 'qiongqi',
    name: { zh: '穷奇', en: 'Qiongqi' },
    type: '妖',
    rarity: '灵',
    region: 'west',
    stats: { power: 80, wisdom: 50, mystery: 70, ferocity: 90, benevolence: 5 },
    riddle: {
      zh: '穷奇西方兽，虎身生翼翎。\n状如猛虎啸，声似天雷鸣。\n知人言语事，食彼忠良形。\n善恶颠倒处，此物最无情。',
      en: 'Qiongqi, the western beast, tiger-bodied with feathered wings.\nFierce as a raging tiger, its voice like heaven\'s thunder.\nIt understands human speech and devours the loyal and virtuous.\nWhere right and wrong are overturned, this creature shows no mercy.'
    },
    lore: {
      zh: '穷奇是出自西野的凶兽，虎身而具翼，形如猛虎而声如雷鸣。它不害无辜，专噬正直忠良之士，以散播混乱与纷争为乐。古书记载穷奇位列四凶之一，与混沌、梼杌、饕餮并称上古四大凶兽。',
      en: 'The Qiongqi is a malevolent creature from the western wilds, with the body of a tiger and powerful wings. Its roar sounds like thunder rolling across the heavens. It feeds not on the innocent but on those who are upright and virtuous, delighting in spreading chaos and discord. In ancient texts, it is counted among the Four Perils alongside Hundun, Taowu, and Taotie — the most dangerous beings in Chinese mythology.'
    },
    encounterText: {
      zh: '沙漠尽头，一道巨大的黑影遮天蔽日。虎身生翼的怪物从天而降，落地时激起漫天黄沙。它的双眼赤红如血，嘴角挂着一丝不祥的笑意——它已经嗅到了你身上那股名为"善良"的气味。',
      en: 'At the edge of the desert, a colossal shadow blots out the sky. The tiger-bodied, winged monster descends, kicking up a storm of sand upon landing. Its eyes burn red as blood, a grim smile curling at its lips — it has caught the scent of something called "virtue" on you.'
    }
  },
  {
    id: 'taotie',
    name: { zh: '饕餮', en: 'Taotie' },
    type: '妖',
    rarity: '仙',
    region: 'west',
    stats: { power: 75, wisdom: 30, mystery: 65, ferocity: 85, benevolence: 0 },
    riddle: {
      zh: '饕餮贪无厌，羊身人面形。\n双目在腋下，虎齿噬不停。\n鼎上有其相，警世喻贪腥。\n纵有千钟粟，难填此物膺。',
      en: 'Taotie, insatiably greedy, goat-bodied with a human face.\nEyes beneath its armpits, tiger teeth gnashing endlessly.\nCast upon ancient tripods, its image warns against the stench of greed.\nEven a thousand bushels of grain cannot fill this creature\'s maw.'
    },
    lore: {
      zh: '饕餮是传说中贪食无厌的恶兽，羊身人面虎齿，吞噬一切却永不知饱。它是四凶之一，象征着无度的贪婪与欲望。商周时期，饕餮纹被广泛铸造于青铜礼器之上，既是装饰更是警世之诫，提醒后人莫因贪欲招致灭顶之灾。',
      en: 'The Taotie is a legendary glutton of insatiable appetite, with a goat\'s body, human face, and tiger\'s teeth. It devours everything in its path yet remains eternally hungry. As one of the Four Perils, it symbolizes boundless greed and desire. During the Shang and Zhou dynasties, the Taotie motif was widely cast on ritual bronze vessels as both decoration and a moral warning against the perils of avarice.'
    },
    encounterText: {
      zh: '大地在颤抖——不是地震，而是某种巨物在进食的震动。沙暴中浮现出一张狰狞的面孔，羊身人面，腋下双目射出贪婪的光芒。它看到什么就吞什么，沙石、枯骨、甚至连影子都不放过。而它看到你时，那双眼睛亮了。',
      en: 'The earth trembles — not from an earthquake, but from the feeding of something massive. A hideous face emerges from the sandstorm: goat-bodied, human-faced, eyes beneath its armpits gleaming with avarice. It devours everything in sight — sand, bones, even shadows. And when it sees you, those eyes light up with hunger.'
    }
  },
  {
    id: 'sand-wyrm',
    name: { zh: '沙虫', en: 'Sand Wyrm' },
    type: '兽',
    rarity: '凡',
    region: 'west',
    stats: { power: 65, wisdom: 20, mystery: 55, ferocity: 70, benevolence: 10 },
    riddle: {
      zh: '沙虫西域生，潜伏黄漠中。\n巨口吞驼马，长身卷狂风。\n昼伏沙丘下，夜出觅食踪。\n商旅过此地，胆战复心惊。',
      en: 'The sand wyrm, born in the Western Regions, lurks within the yellow desert.\nIts giant mouth swallows camels and horses, its long body coils like a storm wind.\nBy day it hides beneath the dunes, by night it hunts for prey.\nMerchants who pass this way tremble in terror and fear.'
    },
    lore: {
      zh: '沙虫潜伏于西域大漠之下，是丝绸之路上商旅们最恐惧的传说之一。其身巨硕无比，能在沙丘间如游鱼般穿行，只有吞噬商队时才会破沙而出。据传沙虫的甲壳坚硬如铁，普通的刀剑根本无法伤其分毫。',
      en: 'The Sand Wyrm lurks beneath the vast deserts of the Western Regions, one of the most feared legends along the Silk Road. Its massive body moves through the dunes like a fish through water, emerging only to swallow entire caravans whole. Its carapace is said to be as hard as iron, impervious to ordinary blades.'
    },
    encounterText: {
      zh: '脚下的沙地突然开始下陷，形成一个巨大的漩涡。流沙之中，一张满是锯齿的巨口破沙而出，带起一股腐臭的狂风。沙虫的身躯如山脊般拱起，在沙丘间起伏不定——你已经踏入了它的猎场。',
      en: 'The sand beneath your feet begins to sink, forming a massive whirlpool. From the swirling sand, a giant maw lined with serrated teeth bursts forth, carrying a putrid gale. The Sand Wyrm\'s body arches like a mountain ridge, undulating across the dunes — you have stepped into its hunting grounds.'
    }
  },

  /* ================================================================
     NORTH (3 beasts)
     ================================================================ */
  {
    id: 'black-tortoise',
    name: { zh: '玄武', en: 'Black Tortoise' },
    type: '兽',
    rarity: '神',
    region: 'north',
    stats: { power: 60, wisdom: 90, mystery: 85, ferocity: 30, benevolence: 80 },
    riddle: {
      zh: '玄武北方神，龟蛇合一身。\n斗柄垂天象，七星照水滨。\n冬藏蕴真气，水德养灵根。\n占卜问吉凶，千古奉为真。',
      en: 'Black Tortoise, northern god, turtle and serpent joined as one.\nThe Dipper\'s handle hangs as celestial sign, seven stars shine upon the shore.\nWinter stores the true qi, water virtue nourishes the spirit root.\nDivining fortune and misfortune, through the ages it is held as truth.'
    },
    lore: {
      zh: '玄武是北方守护神，由龟蛇合体而成，代表冬季、水行与大地恒久之力。作为四象中最古老者，玄武与长寿、占卜及幽深之智相关。上古时期，帝王遇大事必先灼龟甲以问吉凶，玄武因此被视为智慧与预言的化身。',
      en: 'The Black Tortoise is the guardian of the North, formed by the union of a turtle and a serpent. It represents winter, water, and the enduring strength of the earth. As the most ancient of the Four Symbols, the Black Tortoise is associated with longevity, divination, and the hidden wisdom of the deep. In ancient times, emperors would consult turtle shells for omens before great decisions, making the tortoise a symbol of wisdom and prophecy.'
    },
    encounterText: {
      zh: '冰原之上，一座"小山"缓缓移动。走近才看清——那是巨龟驮着一条蜿蜒的玄蛇，蛇首龟首相依相望。玄武的眼睛如同两口深潭，看不到底，却仿佛能映照出你的过去与未来。它沉默如大地，厚重如千年玄冰。',
      en: 'On the frozen plain, a "small mountain" moves slowly. Drawing closer, you see it — a giant tortoise bearing a coiled black serpent, their heads entwined in silent communion. The Black Tortoise\'s eyes are like bottomless pools that seem to reflect your past and future. It is silent as the earth, weighty as millennia of ancient ice.'
    }
  },
  {
    id: 'kun-peng',
    name: { zh: '鲲鹏', en: 'Kun Peng' },
    type: '兽',
    rarity: '神',
    region: 'north',
    stats: { power: 100, wisdom: 65, mystery: 90, ferocity: 60, benevolence: 55 },
    riddle: {
      zh: '北冥有巨鲲，其大不知垠。\n化鹏展垂翼，扶摇九万辰。\n怒飞吞日月，击水动坤轮。\n直上青云外，逍遥自在身。',
      en: 'In the Northern Abyss dwells a giant Kun, its size beyond all measure.\nTransformed into Peng, it spreads its wings — soaring ninety thousand leagues.\nIn rage it swallows sun and moon, its wings stir the cosmic wheel.\nStraight up beyond the azure clouds, free and unfettered in its being.'
    },
    lore: {
      zh: '鲲鹏是不可思议的巨物，首见于道家经典《庄子·逍遥游》。起初为北冥之巨鱼名鲲，其大不知几千里也；后化而为大鹏之鸟，翼若垂天之云，扶摇直上九万里。鲲鹏体现了道家绝对自由、超越世俗局限的理想境界，是中国文化中最宏大的意象之一。',
      en: 'The Kun Peng is a creature of unimaginable scale, first appearing in the Daoist classic Zhuangzi: "Wandering in Absolute Freedom." Beginning as a colossal fish named Kun in the Northern Ocean, it transforms into a gigantic bird named Peng whose wings blot out the sky, soaring ninety thousand li on a whirlwind. It embodies the Daoist ideal of absolute freedom and transcendence beyond worldly limitations — one of the most magnificent images in all Chinese culture.'
    },
    encounterText: {
      zh: '北冥之海骤然翻滚，海水如沸。海面之下，一个巨大的黑影正在上升——大得你无法理解它的尺寸。当它破水而出，化作巨鹏展翅时，双翼遮蔽了整个天空，日月无光。鲲鹏的每一次振翅，都在天地间掀起一场风暴。',
      en: 'The Northern Ocean churns violently, water boiling like a cauldron. Beneath the surface, a colossal black shape rises — so vast your mind cannot grasp its scale. When it bursts from the sea and transforms into a giant Peng, its wings blot out the entire sky, eclipsing sun and moon. Each beat of the Kun Peng\'s wings conjures a storm across heaven and earth.'
    }
  },
  {
    id: 'ice-phoenix',
    name: { zh: '冰凤', en: 'Ice Phoenix' },
    type: '凤',
    rarity: '仙',
    region: 'north',
    stats: { power: 60, wisdom: 75, mystery: 85, ferocity: 40, benevolence: 70 },
    riddle: {
      zh: '冰凤栖寒极，羽翼凝霜晶。\n振翅飞雪落，长鸣寒月惊。\n山川皆素裹，天地尽冰清。\n不与凡鸟伍，孤高傲骨铮。',
      en: 'The Ice Phoenix perches at the pole of cold, its wings forged from frost crystal.\nBeating its wings, snow descends; its cry startles the frozen moon.\nMountains and rivers wrapped in white, heaven and earth pure as ice.\nIt keeps no company with common birds — proud, aloof, its spirit unbending.'
    },
    lore: {
      zh: '冰凤栖于北境雪山之巅，是极寒之地的守护灵鸟。其羽翼由纯粹的冰晶凝结而成，每根羽毛都闪烁着寒光。与南方的火凤迥异，冰凤执掌永冬之力——它的歌声可以冻结流水，它的眼泪化作北极的星光。据说得见冰凤者将获得澄明之悟。',
      en: 'The Ice Phoenix dwells in the frozen peaks of the northern mountains, the guardian spirit of the extreme cold. Its wings are formed of pure ice crystals, each feather gleaming with frigid light. Unlike its fiery southern counterpart, the Ice Phoenix commands the power of eternal winter — its song can freeze flowing water, and its tears become the starlight of the Arctic. Those who glimpse this ethereal bird are said to receive clarity of vision.'
    },
    encounterText: {
      zh: '极光之中，一只透明的冰鸟缓缓展翅。它的身体由万千冰晶构成，在北极光下折射出七彩的光晕。每一次振翅，空气中便凝结出细小的雪花。它唱着凡人听不到的旋律——那是寒风穿过冰凌的声音，纯净而孤寂。',
      en: 'Within the aurora, a translucent ice bird slowly unfurls its wings. Its body is formed of countless ice crystals, refracting a rainbow halo beneath the northern lights. Each wingbeat crystallizes tiny snowflakes from the air. It sings a melody no mortal can hear — the sound of wind passing through icicles, pure and desolate.'
    }
  },

  /* ================================================================
     HEAVEN (4 beasts)
     ================================================================ */
  {
    id: 'dragon-horse',
    name: { zh: '龙马', en: 'Dragon Horse' },
    type: '龙',
    rarity: '灵',
    region: 'heaven',
    stats: { power: 75, wisdom: 70, mystery: 70, ferocity: 45, benevolence: 60 },
    riddle: {
      zh: '龙马出河水，背上有图纹。\n伏羲因画卦，文明自此分。\n身似苍龙体，鬃如烈焰焚。\n踏波行浪去，神迹古今闻。',
      en: 'The Dragon Horse emerged from the River, markings upon its back.\nFuxi drew trigrams from these signs — thus civilization was born.\nIts body like a blue dragon, its mane like blazing fire.\nTreading waves and walking on water, its divine traces known through the ages.'
    },
    lore: {
      zh: '龙马是龙与马结合的神兽，背负"河图"从黄河跃出，献于伏羲。圣人伏羲观龙马身上的纹理而画八卦，开创了中华文明之源。龙马马身龙鳞，踏水而行，是沟通天地、启示智慧的祥瑞之兽，象征着文明与启蒙。',
      en: 'The Dragon Horse emerged from the Yellow River carrying the mystical River Map on its back, presenting it to the sage Fuxi. By studying the markings on the Dragon Horse, Fuxi created the eight trigrams, laying the foundation of Chinese civilization. With the body of a horse and the scales of a dragon, it walks upon water and bridges the earthly and celestial realms — a symbol of enlightenment and the birth of culture.'
    },
    encounterText: {
      zh: '天河之畔，一匹骏马踏波而来。它的马身覆盖着青色的龙鳞，鬃毛如同燃烧的火焰，四蹄所踏之处水花化作星光。它看到你时并未停步，而是昂首嘶鸣，仿佛在向你展示背上那些神秘的纹路——那是宇宙的奥秘。',
      en: 'By the banks of the Heavenly River, a stallion gallops across the water. Its body is covered in azure dragon scales, its mane like burning flames — each hoofprint leaves a splash of starlight. It does not stop at the sight of you, but rears up with a neigh, as if showing you the mysterious markings on its back — the secrets of the cosmos.'
    }
  },
  {
    id: 'golden-crow',
    name: { zh: '金乌', en: 'Golden Crow' },
    type: '兽',
    rarity: '灵',
    region: 'heaven',
    stats: { power: 80, wisdom: 55, mystery: 80, ferocity: 50, benevolence: 45 },
    riddle: {
      zh: '金乌耀扶桑，三足立汤谷。\n展翅日升起，敛羽暮归宿。\n炎精照四海，光华被万物。\n羿射九日落，独留此灵鹄。',
      en: 'The Golden Crow shines from the Fusang tree, three-legged, standing at Tang Valley.\nSpreading its wings, the sun rises; folding its feathers, it returns at dusk.\nIts blazing essence lights the four seas, its brilliance covers all creation.\nYi shot down nine suns — only this celestial crow remained.'
    },
    lore: {
      zh: '金乌是栖息在扶桑树上的三足神鸟，化身为太阳。传说天上有十只金乌，轮流值日巡天。及至十日并出、焦土灼禾，后羿射落九只，唯留其一光照人间。金乌象征光明与生命，但同时也代表太阳不可抗拒的威严与力量。',
      en: 'The Golden Crow is a three-legged solar bird that dwells in the Fusang tree, manifesting as the sun itself. Legend tells that ten Golden Crows once existed, each taking turns to journey across the sky. When all ten rose together and scorched the earth, the archer Hou Yi shot down nine, leaving only one to light the world. The Golden Crow symbolizes light and life, but also the merciless majesty of the sun.'
    },
    encounterText: {
      zh: '扶桑神树上，一只三足金乌正梳理着羽毛。它的周身散发着炽热的光芒，让人无法直视。当它展翅时，整个世界仿佛都亮了一个层次——天界的白昼因它而存在。它看了你一眼，那眼神中既有太阳的威严，也有一丝古老的孤独。',
      en: 'Perched on the divine Fusang tree, a three-legged Golden Crow preens its feathers. Its body radiates a blazing light too brilliant to behold. When it spreads its wings, the entire world brightens by an order of magnitude — heaven\'s daylight exists because of it. It casts you a glance carrying both the majesty of the sun and an ancient loneliness.'
    }
  },
  {
    id: 'moon-rabbit',
    name: { zh: '玉兔', en: 'Moon Rabbit' },
    type: '精',
    rarity: '凡',
    region: 'heaven',
    stats: { power: 10, wisdom: 85, mystery: 70, ferocity: 5, benevolence: 90 },
    riddle: {
      zh: '玉兔居月宫，捣药桂树下。\n持杵研仙药，跪拜不知暇。\n借问何所为，长生济世法。\n清辉照千古，至今未敢罢。\n',
      en: 'The Jade Rabbit lives in the Moon Palace, pounding medicine beneath the cassia tree.\nHolding a pestle, grinding eternal elixir, kneeling tirelessly without rest.\nIf you ask what it does — it brews the way of immortality to heal the world.\nIts pure light shines through the ages, never once has it stopped its work.'
    },
    lore: {
      zh: '玉兔居于月宫，在桂树下持杵捣制长生不老之药。相传玉兔原为一只凡兔，因舍身饲饥——将自身献给一位饥饿的旅人——而被玉帝封为月宫仙兔。玉兔所捣仙药为天界至宝，但它从不吝啬，以济世救人为己任。每至中秋，人间仰望明月，可见玉兔捣药的身影。',
      en: 'The Jade Rabbit lives on the moon, eternally pounding the elixir of immortality with a mortar and pestle beneath a cassia tree. Legend says it was once an ordinary rabbit that offered itself as food to a starving traveler — who was actually the Jade Emperor in disguise — and was rewarded with immortality in the Moon Palace. The rabbit\'s elixir is the most coveted treasure of heaven, yet it selflessly serves the sick and suffering.'
    },
    encounterText: {
      zh: '广寒宫中，桂树飘香。一只通体雪白的玉兔正抱着玉杵，专注地捣着药臼。月光在它身上流淌，仿佛给它镀上了一层银辉。它看到你时停下手里的活儿，竖起长耳朵，然后捧起一小撮仙药，像是要送给你。',
      en: 'Within the Guanghan Palace, the fragrance of cassia blossoms fills the air. A snow-white rabbit, clutching a jade pestle, pounds a mortar with single-minded devotion. Moonlight flows over its body like liquid silver. It pauses at the sight of you, ears perking up, then offers a pinch of celestial elixir — as if to gift it to you.'
    }
  },
  {
    id: 'heavenly-hound',
    name: { zh: '天狗', en: 'Heavenly Hound' },
    type: '兽',
    rarity: '凡',
    region: 'heaven',
    stats: { power: 70, wisdom: 25, mystery: 60, ferocity: 75, benevolence: 20 },
    riddle: {
      zh: '天狗食日月，黑暗临人间。\n奔走如流星，咆哮震天关。\n二郎麾下将，哮天名不悭。\n吞食光明后，乾坤复循环。',
      en: 'The Heavenly Hound devours sun and moon — darkness descends upon the world.\nIt runs like a shooting star, its howl shakes the celestial gates.\nA general under Erlang\'s command, the name "Heavenly Howl" well earned.\nAfter it has swallowed the light, the cosmos cycles once again.'
    },
    lore: {
      zh: '天狗是神话中吞噬日月的神兽，古人认为日食月食便是天狗所为。它形如黑犬，奔行如流星，咆哮可震天关。在某些传说中，天狗是二郎神麾下的哮天神犬，跟随二郎神征战四方。民间每逢月食便会敲锣打鼓，以期驱赶天狗、拯救月亮。',
      en: 'The Heavenly Hound is a celestial beast infamous for devouring the sun and moon — ancient peoples believed solar and lunar eclipses were caused by its insatiable appetite. It takes the form of a massive black dog, running like a shooting star with a howl that shakes the gates of heaven. In some legends, it serves as the Howling Celestial Dog under Erlang Shen\'s command. To this day, folk traditions include banging drums and gongs during eclipses to drive the Heavenly Hound away.'
    },
    encounterText: {
      zh: '一道黑影掠过月轮，天狗自星空间俯冲而下。它浑身漆黑如墨，只有一双血红色的眼睛在黑暗中闪烁。它的喉咙里发出低沉的咆哮，那声音仿佛能穿透灵魂——它正在寻找可以吞噬的光明。',
      en: 'A black silhouette crosses the moon — the Heavenly Hound dives down from between the stars. Its body is dark as ink, with only a pair of blood-red eyes gleaming in the darkness. A low growl rumbles from its throat, a sound that seems to pierce the soul itself — it is searching for light to devour.'
    }
  },

  /* ================================================================
     UNDERWORLD (3 beasts)
     ================================================================ */
  {
    id: 'dark-fox-spirit',
    name: { zh: '玄狐', en: 'Dark Fox Spirit' },
    type: '妖',
    rarity: '灵',
    region: 'underworld',
    stats: { power: 55, wisdom: 80, mystery: 95, ferocity: 60, benevolence: 15 },
    riddle: {
      zh: '玄狐出北地，通幽入冥关。\n千年修魅术，九转入玄坛。\n善惑人心志，能移山与川。\n暗夜行踪迹，阴阳在此间。',
      en: 'The Dark Fox emerges from the northern wilds, crossing through shadows to the underworld\'s gate.\nA thousand years cultivating the arts of enchantment, nine cycles at the mystic altar.\nSkilled at confounding the human heart, powerful enough to move mountains and rivers.\nIt walks in darkness, leaving no trace — yin and yang converge within its being.'
    },
    lore: {
      zh: '玄狐是狐妖中极为罕见的变异存在，由在幽冥之影中修炼禁术的妖狐所化。与九尾狐不同，玄狐不以色相惑人，而是操控黑暗与阴影之力。它能自由穿越阴阳两界，在亡魂与生者之间编织命运的丝线。据说玄狐的出现往往预示大变将至。',
      en: 'The Dark Fox Spirit is a rare and sinister variant of the fox spirit, born from foxes that cultivated forbidden arts in the shadow of the underworld. Unlike its nine-tailed cousin, the Dark Fox does not rely on seduction — it commands the power of darkness and shadow. It crosses freely between the realms of the living and the dead, weaving threads of fate between souls and mortals. Its appearance is said to herald great upheaval.'
    },
    encounterText: {
      zh: '黑暗之中，一双幽绿色的眼睛无声地睁开。玄狐从阴影中缓步走出，毛发如夜色般深沉，每走一步，周围的影子便如水波般荡漾。它不说话，但你清楚地听到一个声音在你脑海中回响——它在打量你的灵魂。',
      en: 'In the darkness, a pair of eerie green eyes open without a sound. The Dark Fox Spirit steps from the shadows, its fur deep as the night itself — each step makes the surrounding shadows ripple like water. It does not speak, yet a voice echoes clearly in your mind — it is weighing your soul.'
    }
  },
  {
    id: 'ghost-serpent',
    name: { zh: '冥蛇', en: 'Ghost Serpent' },
    type: '妖',
    rarity: '凡',
    region: 'underworld',
    stats: { power: 45, wisdom: 35, mystery: 75, ferocity: 65, benevolence: 5 },
    riddle: {
      zh: '冥蛇游九泉，幽暗不见天。\n鳞甲如玄铁，双眸似火燃。\n缠绕枯骨上，盘旋古墓前。\n若有生人近，噬魂入黄泉。',
      en: 'The Ghost Serpent swims through the Nine Springs, in darkness where no sky is seen.\nIts scales are forged like black iron, its eyes burn like twin flames.\nIt coils upon bleached bones, spirals before ancient tombs.\nShould any living soul draw near, it devours the spirit into the Yellow Springs.'
    },
    lore: {
      zh: '冥蛇潜行于幽冥黑水之中，是地府的守卫者。它的鳞甲坚如玄铁，双眸如同两团鬼火。冥蛇缠绕在忘川河畔的枯骨之上，守护着通往审判殿的道路。传说冥蛇之毒并不致命——它吞食的是魂魄，而非肉体。被其咬中者将丧失记忆，永远无法转世。',
      en: 'The Ghost Serpent slithers through the black waters of the underworld, a guardian of the nether realm. Its scales gleam like black iron, its eyes like twin ghost-fires. It coils around bones along the River of Forgetfulness, guarding the path to the judgment hall. Legend says its venom does not kill the body — it consumes the soul, leaving victims unable to reincarnate.'
    },
    encounterText: {
      zh: '忘川河畔的水面泛起涟漪，一条巨大的黑蛇缓缓浮出。它的鳞甲在黑暗中泛着幽光，双瞳如鬼火般跳动。冥蛇环绕着累累白骨，缓缓抬起头，吐着黑色的信子。它没有立即攻击——它只是在确认你究竟是个活人，还是一个迷路的亡魂。',
      en: 'Ripples spread across the River of Forgetfulness as a massive black serpent rises slowly. Its scales emit an eerie phosphorescence in the darkness, its pupils pulsing like ghost-fire. Winding through piles of bleached bones, it raises its head and flicks a black tongue. It does not strike immediately — it is determining whether you are a living being or merely a lost soul.'
    }
  },
  {
    id: 'soul-bird',
    name: { zh: '魂鸟', en: 'Soul Bird' },
    type: '精',
    rarity: '凡',
    region: 'underworld',
    stats: { power: 15, wisdom: 60, mystery: 85, ferocity: 10, benevolence: 65 },
    riddle: {
      zh: '魂鸟出幽冥，其鸣似哭声。\n羽翼如黑雾，双瞳照鬼灯。\n引渡亡魂去，往来阴阳程。\n世人皆畏惧，谁知此君情。',
      en: 'The Soul Bird emerges from the underworld, its call sounds like weeping.\nIts wings are woven from black mist, its eyes shine with ghostly lanterns.\nIt guides departed souls, journeying between yin and yang.\nAll mortal folk fear it — but who understands this creature\'s heart?'
    },
    lore: {
      zh: '魂鸟是幽冥之中沉默的引魂者，其歌声如泣如诉，引导亡魂穿越冥途前往审判之地。它的羽翼由暗影织就，双眸燃烧着苍白的鬼火。虽然凡人视其为不祥之兆，但魂鸟履行着神圣的职责——确保没有灵魂在通往彼岸的归途上迷失。它是幽冥中最孤独的存在，也是亡者们最后的陪伴。',
      en: 'The Soul Bird is a silent psychopomp of the underworld, its haunting melody guiding departed spirits through the shadowy path to judgment. Its wings are woven from shadow and mist, its eyes burning with pale ghost-fire. Though feared by mortals as an omen of death, the Soul Bird performs a sacred duty — ensuring that no soul is lost on its final journey. It is the loneliest being in the underworld, yet also a departed soul\'s last companion.'
    },
    encounterText: {
      zh: '幽冥的天空中，一只通体漆黑的鸟无声地滑过。它的双翼如同流动的暗影，所过之处留下点点磷光。魂鸟发出低沉的鸣叫，那声音像远方的哀歌，却又莫名地安抚人心。在它身后，一串淡淡的灵魂光影紧随不舍——那是被它引领的亡者。',
      en: 'Across the underworld sky, a bird of pure black glides in silence. Its wings flow like living shadows, leaving trails of phosphorescent light. The Soul Bird emits a low cry — a sound like a distant lament, yet strangely soothing to the heart. Behind it, a trail of faint luminous souls follows without pause — the departed it is guiding home.'
    }
  }
];

/* ================================================================
   Region Configuration
   6 regions with particle effects, map positions, and beast lists
   ================================================================ */
var BEAST_REGIONS = [
  {
    id: 'kunlun',
    name: { zh: '昆仑', en: 'Kunlun Mountains' },
    description: {
      zh: '昆仑之墟，万山之祖。西王母的居所，瑶池仙境所在。祥云缭绕，琼楼玉宇隐现其间。这里是天地之间的桥梁，神仙与凡人交汇之地。',
      en: 'The Kunlun ruins, ancestor of all mountains. The dwelling place of the Queen Mother of the West, where the Jade Pool lies. Auspicious clouds swirl around jade towers and golden palaces. It is the bridge between heaven and earth, where gods and mortals meet.'
    },
    particles: { type: 'petal', color: '#ffd700', count: 30 },
    mapPosition: { x: 28, y: 22 },
    beasts: ['qilin', 'white-tiger', 'celestial-crane', 'dangkang']
  },
  {
    id: 'south',
    name: { zh: '南方', en: 'Southern Wilds' },
    description: {
      zh: '南方炎地，烈焰与生机并存。遮天蔽日的古木之间，荧光点点，奇花异草竞相绽放。这里是火之精魂的领域，万物在此疯狂生长。',
      en: 'The Southern Wilds, where flame and life exist in equal measure. Between ancient trees that block out the sky, countless fireflies dance among exotic blossoms. This is the domain of fire spirits, where everything grows in wild abandon.'
    },
    particles: { type: 'firefly', color: '#7fff00', count: 25 },
    mapPosition: { x: 55, y: 55 },
    beasts: ['nine-tailed-fox', 'vermilion-bird', 'xingxing']
  },
  {
    id: 'west',
    name: { zh: '西域', en: 'Western Deserts' },
    description: {
      zh: '西域大漠，黄沙漫天，热浪扭曲了远方的地平线。风沙之下掩埋着无数古城的遗迹。在这片荒芜之地，水源即是生命，凶兽潜伏于沙海之下。',
      en: 'The Western Deserts — endless yellow sand, heat waves distorting the distant horizon. Beneath the dunes lie countless ruins of ancient cities. In this barren wasteland, water is life, and savage beasts lurk beneath the sea of sand.'
    },
    particles: { type: 'ember', color: '#ff8c00', count: 30 },
    mapPosition: { x: 15, y: 40 },
    beasts: ['qiongqi', 'taotie', 'sand-wyrm']
  },
  {
    id: 'north',
    name: { zh: '北冥', en: 'Northern Ice Wastes' },
    description: {
      zh: '北冥冰原，天地一色，万里雪飘。极光在夜空中舞动，冰雪之下沉睡着远古的巨兽。在这片极寒之地，生存本身就是一场与神灵的较量。',
      en: 'The Northern Ice Wastes — a single expanse of white stretching to the horizon. The aurora dances in the night sky, and beneath the ice slumber ancient leviathans. In this land of extreme cold, mere survival is a contest against the divine.'
    },
    particles: { type: 'snow', color: '#e0f0ff', count: 35 },
    mapPosition: { x: 50, y: 12 },
    beasts: ['black-tortoise', 'kun-peng', 'ice-phoenix']
  },
  {
    id: 'heaven',
    name: { zh: '天宫', en: 'Celestial Realm' },
    description: {
      zh: '天宫九重，金光万道，瑞气千条。白玉为阶，琉璃作瓦，天河横贯天际。这里居住着天地间的诸神，天规森严，不可逾越。',
      en: 'The Nine Heavens — a thousand beams of golden light, ten thousand strands of auspicious energy. Stairs of white jade, roofs of colored glaze, the Heavenly River spanning across the sky. Here dwell the gods of heaven and earth, bound by celestial laws that none may break.'
    },
    particles: { type: 'stardust', color: '#fff8dc', count: 25 },
    mapPosition: { x: 50, y: 30 },
    beasts: ['dragon-horse', 'golden-crow', 'moon-rabbit', 'heavenly-hound']
  },
  {
    id: 'underworld',
    name: { zh: '幽冥', en: 'Underworld' },
    description: {
      zh: '幽冥地府，暗无天日。奈何桥上亡魂络绎不绝，彼岸花在黄泉路旁绽放。在这里，生者的气息如同灯塔般醒目。不要回头。',
      en: 'The Underworld — perpetual darkness without a trace of sunlight. On the Bridge of Helplessness, a procession of souls marches endlessly. Blood-red spider lilies bloom along the Yellow Spring Road. Here, the breath of the living shines like a beacon. Do not look back.'
    },
    particles: { type: 'wisp', color: '#9b59b6', count: 25 },
    mapPosition: { x: 50, y: 72 },
    beasts: ['dark-fox-spirit', 'ghost-serpent', 'soul-bird']
  }
];

/* ================================================================
   Helper Functions
   ================================================================ */

/**
 * Get a beast by its unique ID
 * @param {string} id - Beast identifier (e.g. 'qilin', 'taotie')
 * @returns {object|null} The beast object, or null if not found
 */
function getBeastById(id) {
  for (var i = 0; i < MYTHICAL_BEASTS.length; i++) {
    if (MYTHICAL_BEASTS[i].id === id) return MYTHICAL_BEASTS[i];
  }
  return null;
}

/**
 * Get a region by its unique ID
 * @param {string} id - Region identifier (e.g. 'kunlun', 'heaven')
 * @returns {object|null} The region object, or null if not found
 */
function getRegionById(id) {
  for (var i = 0; i < BEAST_REGIONS.length; i++) {
    if (BEAST_REGIONS[i].id === id) return BEAST_REGIONS[i];
  }
  return null;
}

/**
 * Get all beasts belonging to a specific region
 * @param {string} regionId - Region identifier
 * @returns {array} Array of beast objects in that region
 */
function getBeastsByRegion(regionId) {
  var region = getRegionById(regionId);
  if (!region) return [];
  var result = [];
  for (var i = 0; i < region.beasts.length; i++) {
    var beast = getBeastById(region.beasts[i]);
    if (beast) result.push(beast);
  }
  return result;
}

/**
 * Get 3 random riddle distractors from other beasts for multiple-choice
 * @param {string} targetBeastId - The correct beast's ID (will be excluded)
 * @param {string} regionId - Optional region filter (returns local beasts first)
 * @returns {array} Array of 3 beast objects (different from target)
 */
function getRiddleDistractors(targetBeastId, regionId) {
  var pool = [];
  var regionPool = [];

  if (regionId) {
    regionPool = getBeastsByRegion(regionId).filter(function(b) {
      return b.id !== targetBeastId;
    });
  }

  var allOthers = MYTHICAL_BEASTS.filter(function(b) {
    return b.id !== targetBeastId;
  });

  // Start with region-matched beasts, fill remaining from full pool
  while (regionPool.length > 0 && pool.length < 3) {
    var idx = Math.floor(Math.random() * regionPool.length);
    pool.push(regionPool[idx]);
    regionPool.splice(idx, 1);
  }

  while (allOthers.length > 0 && pool.length < 3) {
    var idx2 = Math.floor(Math.random() * allOthers.length);
    // Avoid duplicates already in pool
    var alreadyHas = false;
    for (var i = 0; i < pool.length; i++) {
      if (pool[i].id === allOthers[idx2].id) {
        alreadyHas = true;
        break;
      }
    }
    if (!alreadyHas) {
      pool.push(allOthers[idx2]);
    }
    allOthers.splice(idx2, 1);
  }

  return pool;
}
