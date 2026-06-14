/**
 * Celestial Archive — Deity Registry
 * Central registry of all deities. Add new deities here to
 * auto-populate footers and landing page cards across the site.
 */
var CELESTIAL_DEITIES = [
  {
    slug: 'sun-wukong',
    name: 'Sun Wukong',
    nameZh: '孙悟空',
    title: 'The Monkey King',
    description: 'From stone-born rebel to the Victorious Fighting Buddha.',
    status: 'live',
    avatarBg: '#c44d34',
    avatarInitial: 'S'
  },
  {
    slug: 'nezha',
    name: 'Nezha',
    nameZh: '哪吒',
    title: 'The Third Prince',
    description: 'Lotus-born warrior god. Patron of children, marshal of the celestial armies.',
    status: 'live',
    avatarBg: '#d4687c',
    avatarInitial: 'N'
  },
  {
    slug: 'zhu-bajie',
    name: 'Zhu Bajie',
    nameZh: '猪八戒',
    title: 'The Fallen Marshal',
    description: 'Once commander of 80,000 celestial sailors. Now a pilgrim of appetite and heart.',
    status: 'live',
    avatarBg: '#b8860b',
    avatarInitial: 'Z'
  },
  {
    slug: 'buddha',
    name: 'The Buddha',
    nameZh: '如来佛',
    title: 'The Enlightened One',
    description: 'Lord of the Western Paradise. The one who tamed the Monkey King — not with violence, but with a demonstration of infinity.',
    status: 'live',
    avatarBg: '#daa520',
    avatarInitial: 'B'
  },
  {
    slug: 'guanyin',
    name: 'Guanyin',
    nameZh: '观音',
    title: 'Goddess of Mercy',
    description: 'She who hears the cries of the world. The pilgrimage\'s invisible architect — every rescue, every second chance, every redemption traces back to her.',
    status: 'live',
    avatarBg: '#7ec8a0',
    avatarInitial: 'G'
  },
  {
    slug: 'tang-sanzang',
    name: 'Tang Sanzang',
    nameZh: '唐三藏',
    title: 'The Pilgrim Monk',
    description: 'The heart of the journey. A mortal monk carrying heaven\'s mandate through a world of demons — his faith is the pilgrimage\'s true compass.',
    status: 'live',
    avatarBg: '#4a6fa5',
    avatarInitial: 'T'
  },
  {
    slug: 'erlang-shen',
    name: 'Erlang Shen',
    nameZh: '二郎神',
    title: 'The Equal Rival',
    description: 'Heaven\'s greatest warrior. The only being who ever fought the Monkey King to a standstill — with a third eye that sees through all deception.',
    status: 'live',
    avatarBg: '#5a7a8c',
    avatarInitial: 'E'
  },
  {
    slug: 'sha-wujing',
    name: 'Sha Wujing',
    nameZh: '沙悟净',
    title: 'The Sand Monk',
    description: 'Former Curtain-Raising General, banished to the Flowing Sands River, redeemed as the third disciple of Tang Sanzang.',
    status: 'live',
    avatarBg: '#2d6d6d',
    avatarInitial: 'S'
  },
  {
    slug: 'jade-emperor',
    name: 'Jade Emperor',
    nameZh: '玉皇大帝',
    title: 'Supreme Ruler of Heaven',
    description: 'The highest sovereign of the celestial realm, who governs the universe through a divine bureaucracy.',
    status: 'live',
    avatarBg: '#5a8a6a',
    avatarInitial: 'J'
  },
  {
    slug: 'white-dragon-horse',
    name: 'White Dragon Horse',
    nameZh: '白龙马',
    title: 'The Dragon Prince Steed',
    description: 'Ao Lie, dragon prince of the Western Sea, transformed into Tang Sanzang\'s loyal mount for the pilgrimage.',
    status: 'live',
    avatarBg: '#4a8aa8',
    avatarInitial: 'W'
  },
  {
    slug: 'taishang-laojun',
    name: 'Taishang Laojun',
    nameZh: '太上老君',
    title: 'The Supreme Lord',
    description: 'Daoism\'s highest deity. Keeper of the Eight Trigrams Furnace, master of alchemy — the being whose elixir gave Sun Wukong his indestructible body.',
    status: 'live',
    avatarBg: '#7b4fbf',
    avatarInitial: 'T'
  },
  {
    slug: 'pangu',
    name: 'Pangu',
    nameZh: '盘古',
    title: 'The First Living Being',
    description: 'Born from the cosmic egg, he split heaven from earth with his axe. His body became the world — mountains, rivers, wind, and stars.',
    status: 'live',
    avatarBg: '#c45440',
    avatarInitial: 'P'
  },
  {
    slug: 'nuwa',
    name: 'Nüwa',
    nameZh: '女娲',
    title: 'The Creator Goddess',
    description: 'She who molded humanity from yellow clay and repaired the broken sky with five-colored stones. The mother of all people, the mender of the world.',
    status: 'live',
    avatarBg: '#5a9a8a',
    avatarInitial: 'N'
  },
  {
    slug: 'bull-demon-king',
    name: 'Bull Demon King',
    nameZh: '牛魔王',
    title: 'The Great Bull King',
    description: 'Sworn brother of Sun Wukong, sovereign of Flaming Mountain. The demon king who wielded brute force and primal rage against the armies of heaven itself.',
    status: 'live',
    avatarBg: '#8b4513',
    avatarInitial: 'B'
  },
  {
    slug: 'xiwangmu',
    name: 'Queen Mother of the West',
    nameZh: '西王母',
    title: 'Empress of Immortality',
    description: 'Supreme goddess of the celestial west. Keeper of the Peaches of Immortality, co-ruler of heaven with the Jade Emperor.',
    status: 'live',
    avatarBg: '#6aaa8a',
    avatarInitial: 'X'
  },
  {
    slug: 'princess-iron-fan',
    name: 'Princess Iron Fan',
    nameZh: '铁扇公主',
    title: 'Keeper of the Banana Leaf Fan',
    description: 'The demon queen of Flaming Mountain. Wife of the Bull Demon King, mother of Red Boy — wielder of the Banana Leaf Fan that commands wind, fire, and the very elements.',
    status: 'live',
    avatarBg: '#b8453a',
    avatarInitial: 'P'
  },
  {
    slug: 'chang\'e',
    name: 'Chang\'e',
    nameZh: '嫦娥',
    title: 'The Moon Goddess',
    description: 'The mortal who drank the Elixir of Immortality and ascended to the moon. Goddess of the Mid-Autumn Festival, keeper of Guanghan Palace.',
    status: 'live',
    avatarBg: '#bcc6d4',
    avatarInitial: 'C'
  },
  {
    slug: 'guanyu',
    name: 'Guan Yu',
    nameZh: '关羽',
    title: 'The God of War',
    description: 'From mortal warrior to divine emperor. The red-faced hero of the Three Kingdoms who became China\'s most widely worshipped martial deity.',
    status: 'live',
    avatarBg: '#1a4a2a',
    avatarInitial: 'G'
  },
  {
    slug: 'zhong-kui',
    name: 'Zhong Kui',
    nameZh: '钟馗',
    title: 'The Demon Queller',
    description: 'The fierce ghost-hunting deity who vanquishes evil spirits with his sword and talismans — China\'s divine protector against the supernatural.',
    status: 'live',
    avatarBg: '#b8302c',
    avatarInitial: 'Z'
  },
  {
    slug: 'puti-zushi',
    name: 'Patriarch Subodhi',
    nameZh: '菩提祖师',
    title: 'The Hidden Sage',
    description: 'The master behind the Monkey King\'s every battle. He taught Sun Wukong the 72 transformations, the cloud somersault, and the art of immortality — then vanished without a trace.',
    status: 'live',
    avatarBg: '#5a7a6e',
    avatarInitial: 'P'
  }
];

var CELESTIAL_GAMES = [
  {
    slug: 'havoc-in-heaven',
    nameZh: '大闹天宫',
    nameEn: 'Havoc in Heaven',
    description: 'Relive Sun Wukong\'s legendary rebellion against the celestial court. Battle through 100,000 heavenly soldiers and challenge the might of heaven itself.',
    status: 'live',
    image: 'images/sun-wukong/sun-wukong-hero.jpg'
  },
  {
    slug: 'celestial-divination',
    nameZh: '天庭求签',
    nameEn: 'Celestial Divination',
    description: 'Seek guidance from the celestial court. Draw sacred lots before the Jade Emperor\'s throne and uncover your fate written in the stars.',
    status: 'live',
    image: 'images/jade-emperor/je-court.jpg'
  },
  {
    slug: 'dragon-palace-treasure',
    nameZh: '龙宫探宝',
    nameEn: 'Dragon Palace Treasure',
    description: 'Dive into the Dragon King\'s underwater palace. Navigate coral labyrinths and claim treasures from the depths of the Eastern Sea.',
    status: 'live',
    image: 'images/white-dragon-horse/wlh-hero.jpg'
  },
  {
    slug: 'mythical-beast-collection',
    nameZh: '神兽收集',
    nameEn: 'Mythical Beast Collection',
    description: 'Track and befriend the mythical beasts of Chinese legend. From Qilin to the Nine-tailed Fox, build your own menagerie of magical creatures.',
    status: 'live',
    image: 'images/bull-demon-king/bdk-hero.jpg'
  },
  {
    slug: 'peach-banquet-heist',
    nameZh: '蟠桃盛会',
    nameEn: 'Peach Banquet Heist',
    description: 'Infiltrate the Queen Mother\'s Peach Banquet and devour the fruits of immortality. Avoid celestial guards and become the greatest thief in heaven.',
    status: 'live',
    image: 'images/xiwangmu/xmw-peach-garden.jpg'
  },
  {
    slug: 'eight-trigrams-furnace',
    nameZh: '八卦炉',
    nameEn: 'Eight Trigrams Furnace',
    description: 'Survive the Samadhi Fire inside Taishang Laojun\'s cosmic crucible. Dodge the flames, master the eight trigrams, and forge the legendary Fiery Golden Eyes.',
    status: 'live',
    image: 'images/taishang-laojun/tl-furnace.jpg'
  }
];
