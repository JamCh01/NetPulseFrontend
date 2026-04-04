export interface GeoCity {
  code: string
  en: string
  zh: string
}

export interface GeoCountry {
  code: string
  en: string
  zh: string
  cities: GeoCity[]
}

export interface GeoContinent {
  code: string
  en: string
  zh: string
  countries: GeoCountry[]
}

export const GEO_DATA: GeoContinent[] = [
  // ============================================================
  // ASIA (亚洲)
  // ============================================================
  {
    code: 'AS',
    en: 'Asia',
    zh: '亚洲',
    countries: [
      {
        code: 'AF',
        en: 'Afghanistan',
        zh: '阿富汗',
        cities: [
          { code: 'KBL', en: 'Kabul', zh: '喀布尔' },
          { code: 'KDH', en: 'Kandahar', zh: '坎大哈' },
        ],
      },
      {
        code: 'AM',
        en: 'Armenia',
        zh: '亚美尼亚',
        cities: [
          { code: 'EVN', en: 'Yerevan', zh: '埃里温' },
        ],
      },
      {
        code: 'AZ',
        en: 'Azerbaijan',
        zh: '阿塞拜疆',
        cities: [
          { code: 'GYD', en: 'Baku', zh: '巴库' },
        ],
      },
      {
        code: 'BH',
        en: 'Bahrain',
        zh: '巴林',
        cities: [
          { code: 'BAH', en: 'Manama', zh: '麦纳麦' },
        ],
      },
      {
        code: 'BD',
        en: 'Bangladesh',
        zh: '孟加拉国',
        cities: [
          { code: 'DAC', en: 'Dhaka', zh: '达卡' },
          { code: 'CGP', en: 'Chittagong', zh: '吉大港' },
        ],
      },
      {
        code: 'BT',
        en: 'Bhutan',
        zh: '不丹',
        cities: [
          { code: 'PBH', en: 'Thimphu', zh: '廷布' },
        ],
      },
      {
        code: 'BN',
        en: 'Brunei',
        zh: '文莱',
        cities: [
          { code: 'BWN', en: 'Bandar Seri Begawan', zh: '斯里巴加湾市' },
        ],
      },
      {
        code: 'KH',
        en: 'Cambodia',
        zh: '柬埔寨',
        cities: [
          { code: 'PNH', en: 'Phnom Penh', zh: '金边' },
          { code: 'REP', en: 'Siem Reap', zh: '暹粒' },
        ],
      },
      {
        code: 'CN',
        en: 'China',
        zh: '中国',
        cities: [
          { code: 'BJS', en: 'Beijing', zh: '北京' },
          { code: 'SHA', en: 'Shanghai', zh: '上海' },
          { code: 'CAN', en: 'Guangzhou', zh: '广州' },
          { code: 'SZX', en: 'Shenzhen', zh: '深圳' },
          { code: 'CTU', en: 'Chengdu', zh: '成都' },
          { code: 'HGH', en: 'Hangzhou', zh: '杭州' },
          { code: 'WUH', en: 'Wuhan', zh: '武汉' },
          { code: 'SIA', en: "Xi'an", zh: '西安' },
          { code: 'CKG', en: 'Chongqing', zh: '重庆' },
          { code: 'NKG', en: 'Nanjing', zh: '南京' },
          { code: 'TSN', en: 'Tianjin', zh: '天津' },
          { code: 'CSX', en: 'Changsha', zh: '长沙' },
          { code: 'HKG', en: 'Hong Kong', zh: '香港' },
          { code: 'MFM', en: 'Macau', zh: '澳门' },
          { code: 'TPE', en: 'Taiwan', zh: '台湾' },
        ],
      },
      {
        code: 'CY',
        en: 'Cyprus',
        zh: '塞浦路斯',
        cities: [
          { code: 'NIC', en: 'Nicosia', zh: '尼科西亚' },
          { code: 'LCA', en: 'Larnaca', zh: '拉纳卡' },
        ],
      },
      {
        code: 'TL',
        en: 'East Timor',
        zh: '东帝汶',
        cities: [
          { code: 'DIL', en: 'Dili', zh: '帝力' },
        ],
      },
      {
        code: 'GE',
        en: 'Georgia',
        zh: '格鲁吉亚',
        cities: [
          { code: 'TBS', en: 'Tbilisi', zh: '第比利斯' },
        ],
      },
      {
        code: 'IN',
        en: 'India',
        zh: '印度',
        cities: [
          { code: 'DEL', en: 'New Delhi', zh: '新德里' },
          { code: 'BOM', en: 'Mumbai', zh: '孟买' },
          { code: 'BLR', en: 'Bangalore', zh: '班加罗尔' },
          { code: 'MAA', en: 'Chennai', zh: '金奈' },
          { code: 'CCU', en: 'Kolkata', zh: '加尔各答' },
          { code: 'HYD', en: 'Hyderabad', zh: '海得拉巴' },
          { code: 'AMD', en: 'Ahmedabad', zh: '艾哈迈达巴德' },
          { code: 'PNQ', en: 'Pune', zh: '浦那' },
          { code: 'JAI', en: 'Jaipur', zh: '斋浦尔' },
          { code: 'LKO', en: 'Lucknow', zh: '勒克瑙' },
        ],
      },
      {
        code: 'ID',
        en: 'Indonesia',
        zh: '印度尼西亚',
        cities: [
          { code: 'JKT', en: 'Jakarta', zh: '雅加达' },
          { code: 'SUB', en: 'Surabaya', zh: '泗水' },
          { code: 'DPS', en: 'Bali', zh: '巴厘岛' },
          { code: 'UPG', en: 'Makassar', zh: '望加锡' },
          { code: 'BDO', en: 'Bandung', zh: '万隆' },
          { code: 'MES', en: 'Medan', zh: '棉兰' },
        ],
      },
      {
        code: 'IR',
        en: 'Iran',
        zh: '伊朗',
        cities: [
          { code: 'THR', en: 'Tehran', zh: '德黑兰' },
          { code: 'IFN', en: 'Isfahan', zh: '伊斯法罕' },
          { code: 'SYZ', en: 'Shiraz', zh: '设拉子' },
          { code: 'MHD', en: 'Mashhad', zh: '马什哈德' },
          { code: 'TBZ', en: 'Tabriz', zh: '大不里士' },
        ],
      },
      {
        code: 'IQ',
        en: 'Iraq',
        zh: '伊拉克',
        cities: [
          { code: 'BGW', en: 'Baghdad', zh: '巴格达' },
          { code: 'BSR', en: 'Basra', zh: '巴士拉' },
          { code: 'EBL', en: 'Erbil', zh: '埃尔比勒' },
        ],
      },
      {
        code: 'IL',
        en: 'Israel',
        zh: '以色列',
        cities: [
          { code: 'JRS', en: 'Jerusalem', zh: '耶路撒冷' },
          { code: 'TLV', en: 'Tel Aviv', zh: '特拉维夫' },
          { code: 'HFA', en: 'Haifa', zh: '海法' },
        ],
      },
      {
        code: 'JP',
        en: 'Japan',
        zh: '日本',
        cities: [
          { code: 'TYO', en: 'Tokyo', zh: '东京' },
          { code: 'OSA', en: 'Osaka', zh: '大阪' },
          { code: 'NGO', en: 'Nagoya', zh: '名古屋' },
          { code: 'FUK', en: 'Fukuoka', zh: '福冈' },
          { code: 'SPK', en: 'Sapporo', zh: '札幌' },
          { code: 'KIX', en: 'Kyoto', zh: '京都' },
          { code: 'SDJ', en: 'Sendai', zh: '仙台' },
          { code: 'HIJ', en: 'Hiroshima', zh: '广岛' },
          { code: 'OKA', en: 'Okinawa', zh: '冲绳' },
        ],
      },
      {
        code: 'JO',
        en: 'Jordan',
        zh: '约旦',
        cities: [
          { code: 'AMM', en: 'Amman', zh: '安曼' },
          { code: 'AQJ', en: 'Aqaba', zh: '亚喀巴' },
        ],
      },
      {
        code: 'KZ',
        en: 'Kazakhstan',
        zh: '哈萨克斯坦',
        cities: [
          { code: 'NQZ', en: 'Astana', zh: '阿斯塔纳' },
          { code: 'ALA', en: 'Almaty', zh: '阿拉木图' },
        ],
      },
      {
        code: 'KW',
        en: 'Kuwait',
        zh: '科威特',
        cities: [
          { code: 'KWI', en: 'Kuwait City', zh: '科威特城' },
        ],
      },
      {
        code: 'KG',
        en: 'Kyrgyzstan',
        zh: '吉尔吉斯斯坦',
        cities: [
          { code: 'FRU', en: 'Bishkek', zh: '比什凯克' },
        ],
      },
      {
        code: 'LA',
        en: 'Laos',
        zh: '老挝',
        cities: [
          { code: 'VTE', en: 'Vientiane', zh: '万象' },
          { code: 'LPQ', en: 'Luang Prabang', zh: '琅勃拉邦' },
        ],
      },
      {
        code: 'LB',
        en: 'Lebanon',
        zh: '黎巴嫩',
        cities: [
          { code: 'BEY', en: 'Beirut', zh: '贝鲁特' },
        ],
      },
      {
        code: 'MY',
        en: 'Malaysia',
        zh: '马来西亚',
        cities: [
          { code: 'KUL', en: 'Kuala Lumpur', zh: '吉隆坡' },
          { code: 'PEN', en: 'Penang', zh: '槟城' },
          { code: 'JHB', en: 'Johor Bahru', zh: '新山' },
          { code: 'BKI', en: 'Kota Kinabalu', zh: '哥打基纳巴卢' },
          { code: 'KCH', en: 'Kuching', zh: '古晋' },
        ],
      },
      {
        code: 'MV',
        en: 'Maldives',
        zh: '马尔代夫',
        cities: [
          { code: 'MLE', en: 'Male', zh: '马累' },
        ],
      },
      {
        code: 'MN',
        en: 'Mongolia',
        zh: '蒙古',
        cities: [
          { code: 'ULN', en: 'Ulaanbaatar', zh: '乌兰巴托' },
        ],
      },
      {
        code: 'MM',
        en: 'Myanmar',
        zh: '缅甸',
        cities: [
          { code: 'NPT', en: 'Naypyidaw', zh: '内比都' },
          { code: 'RGN', en: 'Yangon', zh: '仰光' },
          { code: 'MDL', en: 'Mandalay', zh: '曼德勒' },
        ],
      },
      {
        code: 'NP',
        en: 'Nepal',
        zh: '尼泊尔',
        cities: [
          { code: 'KTM', en: 'Kathmandu', zh: '加德满都' },
        ],
      },
      {
        code: 'KP',
        en: 'North Korea',
        zh: '朝鲜',
        cities: [
          { code: 'FNJ', en: 'Pyongyang', zh: '平壤' },
        ],
      },
      {
        code: 'OM',
        en: 'Oman',
        zh: '阿曼',
        cities: [
          { code: 'MCT', en: 'Muscat', zh: '马斯喀特' },
        ],
      },
      {
        code: 'PK',
        en: 'Pakistan',
        zh: '巴基斯坦',
        cities: [
          { code: 'ISB', en: 'Islamabad', zh: '伊斯兰堡' },
          { code: 'KHI', en: 'Karachi', zh: '卡拉奇' },
          { code: 'LHE', en: 'Lahore', zh: '拉合尔' },
          { code: 'PEW', en: 'Peshawar', zh: '白沙瓦' },
          { code: 'FSD', en: 'Faisalabad', zh: '费萨拉巴德' },
        ],
      },
      {
        code: 'PS',
        en: 'Palestine',
        zh: '巴勒斯坦',
        cities: [
          { code: 'RMH', en: 'Ramallah', zh: '拉姆安拉' },
          { code: 'GZA', en: 'Gaza', zh: '加沙' },
        ],
      },
      {
        code: 'PH',
        en: 'Philippines',
        zh: '菲律宾',
        cities: [
          { code: 'MNL', en: 'Manila', zh: '马尼拉' },
          { code: 'CEB', en: 'Cebu', zh: '宿务' },
          { code: 'DVO', en: 'Davao', zh: '达沃' },
          { code: 'CRK', en: 'Clark', zh: '克拉克' },
        ],
      },
      {
        code: 'QA',
        en: 'Qatar',
        zh: '卡塔尔',
        cities: [
          { code: 'DOH', en: 'Doha', zh: '多哈' },
        ],
      },
      {
        code: 'SA',
        en: 'Saudi Arabia',
        zh: '沙特阿拉伯',
        cities: [
          { code: 'RUH', en: 'Riyadh', zh: '利雅得' },
          { code: 'JED', en: 'Jeddah', zh: '吉达' },
          { code: 'MED', en: 'Medina', zh: '麦地那' },
          { code: 'DMM', en: 'Dammam', zh: '达曼' },
          { code: 'MKK', en: 'Mecca', zh: '麦加' },
        ],
      },
      {
        code: 'SG',
        en: 'Singapore',
        zh: '新加坡',
        cities: [
          { code: 'SIN', en: 'Singapore', zh: '新加坡' },
        ],
      },
      {
        code: 'KR',
        en: 'South Korea',
        zh: '韩国',
        cities: [
          { code: 'ICN', en: 'Seoul', zh: '首尔' },
          { code: 'PUS', en: 'Busan', zh: '釜山' },
          { code: 'CJU', en: 'Jeju', zh: '济州' },
          { code: 'TAE', en: 'Daegu', zh: '大邱' },
          { code: 'KWJ', en: 'Gwangju', zh: '光州' },
          { code: 'USN', en: 'Ulsan', zh: '蔚山' },
        ],
      },
      {
        code: 'LK',
        en: 'Sri Lanka',
        zh: '斯里兰卡',
        cities: [
          { code: 'CMB', en: 'Colombo', zh: '科伦坡' },
          { code: 'KDW', en: 'Kandy', zh: '康提' },
        ],
      },
      {
        code: 'SY',
        en: 'Syria',
        zh: '叙利亚',
        cities: [
          { code: 'DAM', en: 'Damascus', zh: '大马士革' },
          { code: 'ALP', en: 'Aleppo', zh: '阿勒颇' },
        ],
      },
      {
        code: 'TJ',
        en: 'Tajikistan',
        zh: '塔吉克斯坦',
        cities: [
          { code: 'DYU', en: 'Dushanbe', zh: '杜尚别' },
        ],
      },
      {
        code: 'TH',
        en: 'Thailand',
        zh: '泰国',
        cities: [
          { code: 'BKK', en: 'Bangkok', zh: '曼谷' },
          { code: 'CNX', en: 'Chiang Mai', zh: '清迈' },
          { code: 'HKT', en: 'Phuket', zh: '普吉' },
          { code: 'HDY', en: 'Hat Yai', zh: '合艾' },
          { code: 'USM', en: 'Koh Samui', zh: '苏梅岛' },
        ],
      },
      {
        code: 'TR',
        en: 'Turkey',
        zh: '土耳其',
        cities: [
          { code: 'ANK', en: 'Ankara', zh: '安卡拉' },
          { code: 'IST', en: 'Istanbul', zh: '伊斯坦布尔' },
          { code: 'AYT', en: 'Antalya', zh: '安塔利亚' },
          { code: 'IZM', en: 'Izmir', zh: '伊兹密尔' },
          { code: 'ADB', en: 'Bursa', zh: '布尔萨' },
        ],
      },
      {
        code: 'TM',
        en: 'Turkmenistan',
        zh: '土库曼斯坦',
        cities: [
          { code: 'ASB', en: 'Ashgabat', zh: '阿什哈巴德' },
        ],
      },
      {
        code: 'AE',
        en: 'UAE',
        zh: '阿联酋',
        cities: [
          { code: 'DXB', en: 'Dubai', zh: '迪拜' },
          { code: 'AUH', en: 'Abu Dhabi', zh: '阿布扎比' },
          { code: 'SHJ', en: 'Sharjah', zh: '沙迦' },
        ],
      },
      {
        code: 'UZ',
        en: 'Uzbekistan',
        zh: '乌兹别克斯坦',
        cities: [
          { code: 'TAS', en: 'Tashkent', zh: '塔什干' },
          { code: 'SKD', en: 'Samarkand', zh: '撒马尔罕' },
        ],
      },
      {
        code: 'VN',
        en: 'Vietnam',
        zh: '越南',
        cities: [
          { code: 'HAN', en: 'Hanoi', zh: '河内' },
          { code: 'SGN', en: 'Ho Chi Minh City', zh: '胡志明市' },
          { code: 'DAD', en: 'Da Nang', zh: '岘港' },
          { code: 'HPH', en: 'Hai Phong', zh: '海防' },
          { code: 'CXR', en: 'Nha Trang', zh: '芽庄' },
        ],
      },
      {
        code: 'YE',
        en: 'Yemen',
        zh: '也门',
        cities: [
          { code: 'SAH', en: 'Sanaa', zh: '萨那' },
          { code: 'ADE', en: 'Aden', zh: '亚丁' },
        ],
      },
    ],
  },

  // ============================================================
  // EUROPE (欧洲)
  // ============================================================
  {
    code: 'EU',
    en: 'Europe',
    zh: '欧洲',
    countries: [
      {
        code: 'AL',
        en: 'Albania',
        zh: '阿尔巴尼亚',
        cities: [
          { code: 'TIA', en: 'Tirana', zh: '地拉那' },
        ],
      },
      {
        code: 'AD',
        en: 'Andorra',
        zh: '安道尔',
        cities: [
          { code: 'ALV', en: 'Andorra la Vella', zh: '安道尔城' },
        ],
      },
      {
        code: 'AT',
        en: 'Austria',
        zh: '奥地利',
        cities: [
          { code: 'VIE', en: 'Vienna', zh: '维也纳' },
          { code: 'SZG', en: 'Salzburg', zh: '萨尔茨堡' },
          { code: 'INN', en: 'Innsbruck', zh: '因斯布鲁克' },
        ],
      },
      {
        code: 'BY',
        en: 'Belarus',
        zh: '白俄罗斯',
        cities: [
          { code: 'MSQ', en: 'Minsk', zh: '明斯克' },
        ],
      },
      {
        code: 'BE',
        en: 'Belgium',
        zh: '比利时',
        cities: [
          { code: 'BRU', en: 'Brussels', zh: '布鲁塞尔' },
          { code: 'ANR', en: 'Antwerp', zh: '安特卫普' },
        ],
      },
      {
        code: 'BA',
        en: 'Bosnia and Herzegovina',
        zh: '波黑',
        cities: [
          { code: 'SJJ', en: 'Sarajevo', zh: '萨拉热窝' },
        ],
      },
      {
        code: 'BG',
        en: 'Bulgaria',
        zh: '保加利亚',
        cities: [
          { code: 'SOF', en: 'Sofia', zh: '索非亚' },
          { code: 'VAR', en: 'Varna', zh: '瓦尔纳' },
        ],
      },
      {
        code: 'HR',
        en: 'Croatia',
        zh: '克罗地亚',
        cities: [
          { code: 'ZAG', en: 'Zagreb', zh: '萨格勒布' },
          { code: 'SPU', en: 'Split', zh: '斯普利特' },
          { code: 'DBV', en: 'Dubrovnik', zh: '杜布罗夫尼克' },
        ],
      },
      {
        code: 'CZ',
        en: 'Czech Republic',
        zh: '捷克',
        cities: [
          { code: 'PRG', en: 'Prague', zh: '布拉格' },
          { code: 'BRQ', en: 'Brno', zh: '布尔诺' },
        ],
      },
      {
        code: 'DK',
        en: 'Denmark',
        zh: '丹麦',
        cities: [
          { code: 'CPH', en: 'Copenhagen', zh: '哥本哈根' },
          { code: 'AAR', en: 'Aarhus', zh: '奥胡斯' },
        ],
      },
      {
        code: 'EE',
        en: 'Estonia',
        zh: '爱沙尼亚',
        cities: [
          { code: 'TLL', en: 'Tallinn', zh: '塔林' },
        ],
      },
      {
        code: 'FI',
        en: 'Finland',
        zh: '芬兰',
        cities: [
          { code: 'HEL', en: 'Helsinki', zh: '赫尔辛基' },
          { code: 'TMP', en: 'Tampere', zh: '坦佩雷' },
        ],
      },
      {
        code: 'FR',
        en: 'France',
        zh: '法国',
        cities: [
          { code: 'PAR', en: 'Paris', zh: '巴黎' },
          { code: 'MRS', en: 'Marseille', zh: '马赛' },
          { code: 'LYS', en: 'Lyon', zh: '里昂' },
          { code: 'NCE', en: 'Nice', zh: '尼斯' },
          { code: 'TLS', en: 'Toulouse', zh: '图卢兹' },
          { code: 'SXB', en: 'Strasbourg', zh: '斯特拉斯堡' },
          { code: 'BOD', en: 'Bordeaux', zh: '波尔多' },
        ],
      },
      {
        code: 'DE',
        en: 'Germany',
        zh: '德国',
        cities: [
          { code: 'BER', en: 'Berlin', zh: '柏林' },
          { code: 'FRA', en: 'Frankfurt', zh: '法兰克福' },
          { code: 'MUC', en: 'Munich', zh: '慕尼黑' },
          { code: 'HAM', en: 'Hamburg', zh: '汉堡' },
          { code: 'CGN', en: 'Cologne', zh: '科隆' },
          { code: 'DUS', en: 'Dusseldorf', zh: '杜塞尔多夫' },
          { code: 'STR', en: 'Stuttgart', zh: '斯图加特' },
          { code: 'LEJ', en: 'Leipzig', zh: '莱比锡' },
          { code: 'DRS', en: 'Dresden', zh: '德累斯顿' },
        ],
      },
      {
        code: 'GR',
        en: 'Greece',
        zh: '希腊',
        cities: [
          { code: 'ATH', en: 'Athens', zh: '雅典' },
          { code: 'SKG', en: 'Thessaloniki', zh: '塞萨洛尼基' },
          { code: 'HER', en: 'Heraklion', zh: '伊拉克利翁' },
        ],
      },
      {
        code: 'HU',
        en: 'Hungary',
        zh: '匈牙利',
        cities: [
          { code: 'BUD', en: 'Budapest', zh: '布达佩斯' },
          { code: 'DEB', en: 'Debrecen', zh: '德布勒森' },
        ],
      },
      {
        code: 'IS',
        en: 'Iceland',
        zh: '冰岛',
        cities: [
          { code: 'REK', en: 'Reykjavik', zh: '雷克雅未克' },
        ],
      },
      {
        code: 'IE',
        en: 'Ireland',
        zh: '爱尔兰',
        cities: [
          { code: 'DUB', en: 'Dublin', zh: '都柏林' },
          { code: 'ORK', en: 'Cork', zh: '科克' },
        ],
      },
      {
        code: 'IT',
        en: 'Italy',
        zh: '意大利',
        cities: [
          { code: 'FCO', en: 'Rome', zh: '罗马' },
          { code: 'MIL', en: 'Milan', zh: '米兰' },
          { code: 'NAP', en: 'Naples', zh: '那不勒斯' },
          { code: 'FLR', en: 'Florence', zh: '佛罗伦萨' },
          { code: 'VCE', en: 'Venice', zh: '威尼斯' },
          { code: 'TRN', en: 'Turin', zh: '都灵' },
          { code: 'BLQ', en: 'Bologna', zh: '博洛尼亚' },
        ],
      },
      {
        code: 'XK',
        en: 'Kosovo',
        zh: '科索沃',
        cities: [
          { code: 'PRN', en: 'Pristina', zh: '普里什蒂纳' },
        ],
      },
      {
        code: 'LV',
        en: 'Latvia',
        zh: '拉脱维亚',
        cities: [
          { code: 'RIX', en: 'Riga', zh: '里加' },
        ],
      },
      {
        code: 'LI',
        en: 'Liechtenstein',
        zh: '列支敦士登',
        cities: [
          { code: 'VDZ', en: 'Vaduz', zh: '瓦杜兹' },
        ],
      },
      {
        code: 'LT',
        en: 'Lithuania',
        zh: '立陶宛',
        cities: [
          { code: 'VNO', en: 'Vilnius', zh: '维尔纽斯' },
          { code: 'KUN', en: 'Kaunas', zh: '考纳斯' },
        ],
      },
      {
        code: 'LU',
        en: 'Luxembourg',
        zh: '卢森堡',
        cities: [
          { code: 'LUX', en: 'Luxembourg City', zh: '卢森堡市' },
        ],
      },
      {
        code: 'MT',
        en: 'Malta',
        zh: '马耳他',
        cities: [
          { code: 'MLA', en: 'Valletta', zh: '瓦莱塔' },
        ],
      },
      {
        code: 'MD',
        en: 'Moldova',
        zh: '摩尔多瓦',
        cities: [
          { code: 'KIV', en: 'Chisinau', zh: '基希讷乌' },
        ],
      },
      {
        code: 'MC',
        en: 'Monaco',
        zh: '摩纳哥',
        cities: [
          { code: 'MCM', en: 'Monaco', zh: '摩纳哥' },
        ],
      },
      {
        code: 'ME',
        en: 'Montenegro',
        zh: '黑山',
        cities: [
          { code: 'TGD', en: 'Podgorica', zh: '波德戈里察' },
        ],
      },
      {
        code: 'NL',
        en: 'Netherlands',
        zh: '荷兰',
        cities: [
          { code: 'AMS', en: 'Amsterdam', zh: '阿姆斯特丹' },
          { code: 'RTM', en: 'Rotterdam', zh: '鹿特丹' },
          { code: 'EIN', en: 'Eindhoven', zh: '埃因霍温' },
        ],
      },
      {
        code: 'MK',
        en: 'North Macedonia',
        zh: '北马其顿',
        cities: [
          { code: 'SKP', en: 'Skopje', zh: '斯科普里' },
        ],
      },
      {
        code: 'NO',
        en: 'Norway',
        zh: '挪威',
        cities: [
          { code: 'OSL', en: 'Oslo', zh: '奥斯陆' },
          { code: 'BGO', en: 'Bergen', zh: '卑尔根' },
          { code: 'TRD', en: 'Trondheim', zh: '特隆赫姆' },
        ],
      },
      {
        code: 'PL',
        en: 'Poland',
        zh: '波兰',
        cities: [
          { code: 'WAW', en: 'Warsaw', zh: '华沙' },
          { code: 'KRK', en: 'Krakow', zh: '克拉科夫' },
          { code: 'WRO', en: 'Wroclaw', zh: '弗罗茨瓦夫' },
          { code: 'GDN', en: 'Gdansk', zh: '格但斯克' },
          { code: 'POZ', en: 'Poznan', zh: '波兹南' },
        ],
      },
      {
        code: 'PT',
        en: 'Portugal',
        zh: '葡萄牙',
        cities: [
          { code: 'LIS', en: 'Lisbon', zh: '里斯本' },
          { code: 'OPO', en: 'Porto', zh: '波尔图' },
          { code: 'FAO', en: 'Faro', zh: '法鲁' },
        ],
      },
      {
        code: 'RO',
        en: 'Romania',
        zh: '罗马尼亚',
        cities: [
          { code: 'OTP', en: 'Bucharest', zh: '布加勒斯特' },
          { code: 'CLJ', en: 'Cluj-Napoca', zh: '克卢日-纳波卡' },
        ],
      },
      {
        code: 'RU',
        en: 'Russia',
        zh: '俄罗斯',
        cities: [
          { code: 'MOW', en: 'Moscow', zh: '莫斯科' },
          { code: 'LED', en: 'Saint Petersburg', zh: '圣彼得堡' },
          { code: 'SVX', en: 'Yekaterinburg', zh: '叶卡捷琳堡' },
          { code: 'OVB', en: 'Novosibirsk', zh: '新西伯利亚' },
          { code: 'KZN', en: 'Kazan', zh: '喀山' },
          { code: 'ROV', en: 'Rostov-on-Don', zh: '顿河畔罗斯托夫' },
          { code: 'VVO', en: 'Vladivostok', zh: '海参崴' },
          { code: 'KJA', en: 'Krasnoyarsk', zh: '克拉斯诺亚尔斯克' },
        ],
      },
      {
        code: 'SM',
        en: 'San Marino',
        zh: '圣马力诺',
        cities: [
          { code: 'SAI', en: 'San Marino', zh: '圣马力诺' },
        ],
      },
      {
        code: 'RS',
        en: 'Serbia',
        zh: '塞尔维亚',
        cities: [
          { code: 'BEG', en: 'Belgrade', zh: '贝尔格莱德' },
          { code: 'INI', en: 'Nis', zh: '尼什' },
        ],
      },
      {
        code: 'SK',
        en: 'Slovakia',
        zh: '斯洛伐克',
        cities: [
          { code: 'BTS', en: 'Bratislava', zh: '布拉迪斯拉发' },
        ],
      },
      {
        code: 'SI',
        en: 'Slovenia',
        zh: '斯洛文尼亚',
        cities: [
          { code: 'LJU', en: 'Ljubljana', zh: '卢布尔雅那' },
        ],
      },
      {
        code: 'ES',
        en: 'Spain',
        zh: '西班牙',
        cities: [
          { code: 'MAD', en: 'Madrid', zh: '马德里' },
          { code: 'BCN', en: 'Barcelona', zh: '巴塞罗那' },
          { code: 'VLC', en: 'Valencia', zh: '巴伦西亚' },
          { code: 'SVQ', en: 'Seville', zh: '塞维利亚' },
          { code: 'AGP', en: 'Malaga', zh: '马拉加' },
          { code: 'BIO', en: 'Bilbao', zh: '毕尔巴鄂' },
        ],
      },
      {
        code: 'SE',
        en: 'Sweden',
        zh: '瑞典',
        cities: [
          { code: 'ARN', en: 'Stockholm', zh: '斯德哥尔摩' },
          { code: 'GOT', en: 'Gothenburg', zh: '哥德堡' },
          { code: 'MMA', en: 'Malmo', zh: '马尔默' },
        ],
      },
      {
        code: 'CH',
        en: 'Switzerland',
        zh: '瑞士',
        cities: [
          { code: 'BRN', en: 'Bern', zh: '伯尔尼' },
          { code: 'ZRH', en: 'Zurich', zh: '苏黎世' },
          { code: 'GVA', en: 'Geneva', zh: '日内瓦' },
          { code: 'BSL', en: 'Basel', zh: '巴塞尔' },
        ],
      },
      {
        code: 'UA',
        en: 'Ukraine',
        zh: '乌克兰',
        cities: [
          { code: 'IEV', en: 'Kyiv', zh: '基辅' },
          { code: 'ODS', en: 'Odessa', zh: '敖德萨' },
          { code: 'HRK', en: 'Kharkiv', zh: '哈尔科夫' },
          { code: 'LWO', en: 'Lviv', zh: '利沃夫' },
        ],
      },
      {
        code: 'GB',
        en: 'United Kingdom',
        zh: '英国',
        cities: [
          { code: 'LON', en: 'London', zh: '伦敦' },
          { code: 'MAN', en: 'Manchester', zh: '曼彻斯特' },
          { code: 'BHX', en: 'Birmingham', zh: '伯明翰' },
          { code: 'EDI', en: 'Edinburgh', zh: '爱丁堡' },
          { code: 'GLA', en: 'Glasgow', zh: '格拉斯哥' },
          { code: 'BRS', en: 'Bristol', zh: '布里斯托尔' },
          { code: 'LPL', en: 'Liverpool', zh: '利物浦' },
          { code: 'LDS', en: 'Leeds', zh: '利兹' },
        ],
      },
      {
        code: 'VA',
        en: 'Vatican City',
        zh: '梵蒂冈',
        cities: [
          { code: 'VAT', en: 'Vatican City', zh: '梵蒂冈城' },
        ],
      },
    ],
  },

  // ============================================================
  // NORTH AMERICA (北美洲)
  // ============================================================
  {
    code: 'NA',
    en: 'North America',
    zh: '北美洲',
    countries: [
      {
        code: 'AG',
        en: 'Antigua and Barbuda',
        zh: '安提瓜和巴布达',
        cities: [
          { code: 'ANU', en: "Saint John's", zh: '圣约翰' },
        ],
      },
      {
        code: 'BS',
        en: 'Bahamas',
        zh: '巴哈马',
        cities: [
          { code: 'NAS', en: 'Nassau', zh: '拿骚' },
        ],
      },
      {
        code: 'BB',
        en: 'Barbados',
        zh: '巴巴多斯',
        cities: [
          { code: 'BGI', en: 'Bridgetown', zh: '布里奇敦' },
        ],
      },
      {
        code: 'BZ',
        en: 'Belize',
        zh: '伯利兹',
        cities: [
          { code: 'BZE', en: 'Belmopan', zh: '贝尔莫潘' },
        ],
      },
      {
        code: 'CA',
        en: 'Canada',
        zh: '加拿大',
        cities: [
          { code: 'YOW', en: 'Ottawa', zh: '渥太华' },
          { code: 'YYZ', en: 'Toronto', zh: '多伦多' },
          { code: 'YVR', en: 'Vancouver', zh: '温哥华' },
          { code: 'YUL', en: 'Montreal', zh: '蒙特利尔' },
          { code: 'YYC', en: 'Calgary', zh: '卡尔加里' },
          { code: 'YEG', en: 'Edmonton', zh: '埃德蒙顿' },
          { code: 'YHZ', en: 'Halifax', zh: '哈利法克斯' },
          { code: 'YWG', en: 'Winnipeg', zh: '温尼伯' },
        ],
      },
      {
        code: 'CR',
        en: 'Costa Rica',
        zh: '哥斯达黎加',
        cities: [
          { code: 'SJO', en: 'San Jose', zh: '圣何塞' },
        ],
      },
      {
        code: 'CU',
        en: 'Cuba',
        zh: '古巴',
        cities: [
          { code: 'HAV', en: 'Havana', zh: '哈瓦那' },
          { code: 'SCU', en: 'Santiago de Cuba', zh: '圣地亚哥' },
        ],
      },
      {
        code: 'DM',
        en: 'Dominica',
        zh: '多米尼克',
        cities: [
          { code: 'DOM', en: 'Roseau', zh: '罗索' },
        ],
      },
      {
        code: 'DO',
        en: 'Dominican Republic',
        zh: '多米尼加',
        cities: [
          { code: 'SDQ', en: 'Santo Domingo', zh: '圣多明各' },
          { code: 'PUJ', en: 'Punta Cana', zh: '蓬塔卡纳' },
        ],
      },
      {
        code: 'SV',
        en: 'El Salvador',
        zh: '萨尔瓦多',
        cities: [
          { code: 'SAL', en: 'San Salvador', zh: '圣萨尔瓦多' },
        ],
      },
      {
        code: 'GD',
        en: 'Grenada',
        zh: '格林纳达',
        cities: [
          { code: 'GND', en: "Saint George's", zh: '圣乔治' },
        ],
      },
      {
        code: 'GT',
        en: 'Guatemala',
        zh: '危地马拉',
        cities: [
          { code: 'GUA', en: 'Guatemala City', zh: '危地马拉城' },
        ],
      },
      {
        code: 'HT',
        en: 'Haiti',
        zh: '海地',
        cities: [
          { code: 'PAP', en: 'Port-au-Prince', zh: '太子港' },
        ],
      },
      {
        code: 'HN',
        en: 'Honduras',
        zh: '洪都拉斯',
        cities: [
          { code: 'TGU', en: 'Tegucigalpa', zh: '特古西加尔巴' },
          { code: 'SAP', en: 'San Pedro Sula', zh: '圣佩德罗苏拉' },
        ],
      },
      {
        code: 'JM',
        en: 'Jamaica',
        zh: '牙买加',
        cities: [
          { code: 'KIN', en: 'Kingston', zh: '金斯敦' },
          { code: 'MBJ', en: 'Montego Bay', zh: '蒙特哥贝' },
        ],
      },
      {
        code: 'MX',
        en: 'Mexico',
        zh: '墨西哥',
        cities: [
          { code: 'MEX', en: 'Mexico City', zh: '墨西哥城' },
          { code: 'GDL', en: 'Guadalajara', zh: '瓜达拉哈拉' },
          { code: 'MTY', en: 'Monterrey', zh: '蒙特雷' },
          { code: 'CUN', en: 'Cancun', zh: '坎昆' },
          { code: 'TIJ', en: 'Tijuana', zh: '蒂华纳' },
          { code: 'PVR', en: 'Puerto Vallarta', zh: '巴亚尔塔港' },
        ],
      },
      {
        code: 'NI',
        en: 'Nicaragua',
        zh: '尼加拉瓜',
        cities: [
          { code: 'MGA', en: 'Managua', zh: '马那瓜' },
        ],
      },
      {
        code: 'PA',
        en: 'Panama',
        zh: '巴拿马',
        cities: [
          { code: 'PTY', en: 'Panama City', zh: '巴拿马城' },
        ],
      },
      {
        code: 'KN',
        en: 'Saint Kitts and Nevis',
        zh: '圣基茨和尼维斯',
        cities: [
          { code: 'SKB', en: 'Basseterre', zh: '巴斯特尔' },
        ],
      },
      {
        code: 'LC',
        en: 'Saint Lucia',
        zh: '圣卢西亚',
        cities: [
          { code: 'SLU', en: 'Castries', zh: '卡斯特里' },
        ],
      },
      {
        code: 'VC',
        en: 'Saint Vincent and the Grenadines',
        zh: '圣文森特和格林纳丁斯',
        cities: [
          { code: 'SVD', en: 'Kingstown', zh: '金斯敦' },
        ],
      },
      {
        code: 'TT',
        en: 'Trinidad and Tobago',
        zh: '特立尼达和多巴哥',
        cities: [
          { code: 'POS', en: 'Port of Spain', zh: '西班牙港' },
        ],
      },
      {
        code: 'US',
        en: 'United States',
        zh: '美国',
        cities: [
          { code: 'IAD', en: 'Washington D.C.', zh: '华盛顿' },
          { code: 'NYC', en: 'New York', zh: '纽约' },
          { code: 'LAX', en: 'Los Angeles', zh: '洛杉矶' },
          { code: 'SFO', en: 'San Francisco', zh: '旧金山' },
          { code: 'SEA', en: 'Seattle', zh: '西雅图' },
          { code: 'ORD', en: 'Chicago', zh: '芝加哥' },
          { code: 'DFW', en: 'Dallas', zh: '达拉斯' },
          { code: 'MIA', en: 'Miami', zh: '迈阿密' },
          { code: 'ATL', en: 'Atlanta', zh: '亚特兰大' },
          { code: 'DEN', en: 'Denver', zh: '丹佛' },
          { code: 'PHX', en: 'Phoenix', zh: '凤凰城' },
          { code: 'SJC', en: 'San Jose', zh: '圣何塞' },
          { code: 'BOS', en: 'Boston', zh: '波士顿' },
          { code: 'IAH', en: 'Houston', zh: '休斯顿' },
          { code: 'LAS', en: 'Las Vegas', zh: '拉斯维加斯' },
        ],
      },
    ],
  },

  // ============================================================
  // SOUTH AMERICA (南美洲)
  // ============================================================
  {
    code: 'SA',
    en: 'South America',
    zh: '南美洲',
    countries: [
      {
        code: 'AR',
        en: 'Argentina',
        zh: '阿根廷',
        cities: [
          { code: 'EZE', en: 'Buenos Aires', zh: '布宜诺斯艾利斯' },
          { code: 'COR', en: 'Cordoba', zh: '科尔多瓦' },
          { code: 'ROS', en: 'Rosario', zh: '罗萨里奥' },
          { code: 'MDZ', en: 'Mendoza', zh: '门多萨' },
        ],
      },
      {
        code: 'BO',
        en: 'Bolivia',
        zh: '玻利维亚',
        cities: [
          { code: 'LPB', en: 'La Paz', zh: '拉巴斯' },
          { code: 'SRE', en: 'Sucre', zh: '苏克雷' },
          { code: 'VVI', en: 'Santa Cruz', zh: '圣克鲁斯' },
        ],
      },
      {
        code: 'BR',
        en: 'Brazil',
        zh: '巴西',
        cities: [
          { code: 'BSB', en: 'Brasilia', zh: '巴西利亚' },
          { code: 'GRU', en: 'Sao Paulo', zh: '圣保罗' },
          { code: 'GIG', en: 'Rio de Janeiro', zh: '里约热内卢' },
          { code: 'SSA', en: 'Salvador', zh: '萨尔瓦多' },
          { code: 'FOR', en: 'Fortaleza', zh: '福塔莱萨' },
          { code: 'REC', en: 'Recife', zh: '累西腓' },
          { code: 'BHZ', en: 'Belo Horizonte', zh: '贝洛奥里藏特' },
          { code: 'POA', en: 'Porto Alegre', zh: '阿雷格里港' },
          { code: 'CWB', en: 'Curitiba', zh: '库里蒂巴' },
          { code: 'MAO', en: 'Manaus', zh: '马瑙斯' },
        ],
      },
      {
        code: 'CL',
        en: 'Chile',
        zh: '智利',
        cities: [
          { code: 'SCL', en: 'Santiago', zh: '圣地亚哥' },
          { code: 'CCP', en: 'Concepcion', zh: '康塞普西翁' },
          { code: 'ANF', en: 'Antofagasta', zh: '安托法加斯塔' },
        ],
      },
      {
        code: 'CO',
        en: 'Colombia',
        zh: '哥伦比亚',
        cities: [
          { code: 'BOG', en: 'Bogota', zh: '波哥大' },
          { code: 'MDE', en: 'Medellin', zh: '麦德林' },
          { code: 'CLO', en: 'Cali', zh: '卡利' },
          { code: 'CTG', en: 'Cartagena', zh: '卡塔赫纳' },
          { code: 'BAQ', en: 'Barranquilla', zh: '巴兰基亚' },
        ],
      },
      {
        code: 'EC',
        en: 'Ecuador',
        zh: '厄瓜多尔',
        cities: [
          { code: 'UIO', en: 'Quito', zh: '基多' },
          { code: 'GYE', en: 'Guayaquil', zh: '瓜亚基尔' },
        ],
      },
      {
        code: 'GY',
        en: 'Guyana',
        zh: '圭亚那',
        cities: [
          { code: 'GEO', en: 'Georgetown', zh: '乔治敦' },
        ],
      },
      {
        code: 'PY',
        en: 'Paraguay',
        zh: '巴拉圭',
        cities: [
          { code: 'ASU', en: 'Asuncion', zh: '亚松森' },
        ],
      },
      {
        code: 'PE',
        en: 'Peru',
        zh: '秘鲁',
        cities: [
          { code: 'LIM', en: 'Lima', zh: '利马' },
          { code: 'CUZ', en: 'Cusco', zh: '库斯科' },
          { code: 'AQP', en: 'Arequipa', zh: '阿雷基帕' },
        ],
      },
      {
        code: 'SR',
        en: 'Suriname',
        zh: '苏里南',
        cities: [
          { code: 'PBM', en: 'Paramaribo', zh: '帕拉马里博' },
        ],
      },
      {
        code: 'UY',
        en: 'Uruguay',
        zh: '乌拉圭',
        cities: [
          { code: 'MVD', en: 'Montevideo', zh: '蒙得维的亚' },
        ],
      },
      {
        code: 'VE',
        en: 'Venezuela',
        zh: '委内瑞拉',
        cities: [
          { code: 'CCS', en: 'Caracas', zh: '加拉加斯' },
          { code: 'MAR', en: 'Maracaibo', zh: '马拉开波' },
        ],
      },
    ],
  },

  // ============================================================
  // AFRICA (非洲)
  // ============================================================
  {
    code: 'AF',
    en: 'Africa',
    zh: '非洲',
    countries: [
      {
        code: 'DZ',
        en: 'Algeria',
        zh: '阿尔及利亚',
        cities: [
          { code: 'ALG', en: 'Algiers', zh: '阿尔及尔' },
          { code: 'ORN', en: 'Oran', zh: '奥兰' },
        ],
      },
      {
        code: 'AO',
        en: 'Angola',
        zh: '安哥拉',
        cities: [
          { code: 'LAD', en: 'Luanda', zh: '罗安达' },
        ],
      },
      {
        code: 'BJ',
        en: 'Benin',
        zh: '贝宁',
        cities: [
          { code: 'COO', en: 'Cotonou', zh: '科托努' },
          { code: 'PKO', en: 'Porto-Novo', zh: '波多诺伏' },
        ],
      },
      {
        code: 'BW',
        en: 'Botswana',
        zh: '博茨瓦纳',
        cities: [
          { code: 'GBE', en: 'Gaborone', zh: '哈博罗内' },
        ],
      },
      {
        code: 'BF',
        en: 'Burkina Faso',
        zh: '布基纳法索',
        cities: [
          { code: 'OUA', en: 'Ouagadougou', zh: '瓦加杜古' },
        ],
      },
      {
        code: 'BI',
        en: 'Burundi',
        zh: '布隆迪',
        cities: [
          { code: 'GTC', en: 'Gitega', zh: '基特加' },
          { code: 'BJM', en: 'Bujumbura', zh: '布琼布拉' },
        ],
      },
      {
        code: 'CM',
        en: 'Cameroon',
        zh: '喀麦隆',
        cities: [
          { code: 'NSI', en: 'Yaounde', zh: '雅温得' },
          { code: 'DLA', en: 'Douala', zh: '杜阿拉' },
        ],
      },
      {
        code: 'CV',
        en: 'Cape Verde',
        zh: '佛得角',
        cities: [
          { code: 'RAI', en: 'Praia', zh: '普拉亚' },
        ],
      },
      {
        code: 'CF',
        en: 'Central African Republic',
        zh: '中非共和国',
        cities: [
          { code: 'BGF', en: 'Bangui', zh: '班吉' },
        ],
      },
      {
        code: 'TD',
        en: 'Chad',
        zh: '乍得',
        cities: [
          { code: 'NDJ', en: "N'Djamena", zh: '恩贾梅纳' },
        ],
      },
      {
        code: 'KM',
        en: 'Comoros',
        zh: '科摩罗',
        cities: [
          { code: 'HAH', en: 'Moroni', zh: '莫罗尼' },
        ],
      },
      {
        code: 'CG',
        en: 'Congo (Republic)',
        zh: '刚果（布）',
        cities: [
          { code: 'BZV', en: 'Brazzaville', zh: '布拉柴维尔' },
        ],
      },
      {
        code: 'CD',
        en: 'Congo (DR)',
        zh: '刚果（金）',
        cities: [
          { code: 'FIH', en: 'Kinshasa', zh: '金沙萨' },
          { code: 'FBM', en: 'Lubumbashi', zh: '卢本巴希' },
        ],
      },
      {
        code: 'DJ',
        en: 'Djibouti',
        zh: '吉布提',
        cities: [
          { code: 'JIB', en: 'Djibouti', zh: '吉布提市' },
        ],
      },
      {
        code: 'EG',
        en: 'Egypt',
        zh: '埃及',
        cities: [
          { code: 'CAI', en: 'Cairo', zh: '开罗' },
          { code: 'ALY', en: 'Alexandria', zh: '亚历山大' },
          { code: 'LXR', en: 'Luxor', zh: '卢克索' },
          { code: 'HRG', en: 'Hurghada', zh: '赫尔格达' },
          { code: 'SSH', en: 'Sharm el-Sheikh', zh: '沙姆沙伊赫' },
        ],
      },
      {
        code: 'GQ',
        en: 'Equatorial Guinea',
        zh: '赤道几内亚',
        cities: [
          { code: 'SSG', en: 'Malabo', zh: '马拉博' },
        ],
      },
      {
        code: 'ER',
        en: 'Eritrea',
        zh: '厄立特里亚',
        cities: [
          { code: 'ASM', en: 'Asmara', zh: '阿斯马拉' },
        ],
      },
      {
        code: 'SZ',
        en: 'Eswatini',
        zh: '斯威士兰',
        cities: [
          { code: 'MTS', en: 'Mbabane', zh: '姆巴巴内' },
        ],
      },
      {
        code: 'ET',
        en: 'Ethiopia',
        zh: '埃塞俄比亚',
        cities: [
          { code: 'ADD', en: 'Addis Ababa', zh: '亚的斯亚贝巴' },
          { code: 'DIR', en: 'Dire Dawa', zh: '德雷达瓦' },
        ],
      },
      {
        code: 'GA',
        en: 'Gabon',
        zh: '加蓬',
        cities: [
          { code: 'LBV', en: 'Libreville', zh: '利伯维尔' },
        ],
      },
      {
        code: 'GM',
        en: 'Gambia',
        zh: '冈比亚',
        cities: [
          { code: 'BJL', en: 'Banjul', zh: '班珠尔' },
        ],
      },
      {
        code: 'GH',
        en: 'Ghana',
        zh: '加纳',
        cities: [
          { code: 'ACC', en: 'Accra', zh: '阿克拉' },
          { code: 'KMS', en: 'Kumasi', zh: '库马西' },
        ],
      },
      {
        code: 'GN',
        en: 'Guinea',
        zh: '几内亚',
        cities: [
          { code: 'CKY', en: 'Conakry', zh: '科纳克里' },
        ],
      },
      {
        code: 'GW',
        en: 'Guinea-Bissau',
        zh: '几内亚比绍',
        cities: [
          { code: 'OXB', en: 'Bissau', zh: '比绍' },
        ],
      },
      {
        code: 'CI',
        en: 'Ivory Coast',
        zh: '科特迪瓦',
        cities: [
          { code: 'YMS', en: 'Yamoussoukro', zh: '亚穆苏克罗' },
          { code: 'ABJ', en: 'Abidjan', zh: '阿比让' },
        ],
      },
      {
        code: 'KE',
        en: 'Kenya',
        zh: '肯尼亚',
        cities: [
          { code: 'NBO', en: 'Nairobi', zh: '内罗毕' },
          { code: 'MBA', en: 'Mombasa', zh: '蒙巴萨' },
          { code: 'KIS', en: 'Kisumu', zh: '基苏木' },
        ],
      },
      {
        code: 'LS',
        en: 'Lesotho',
        zh: '莱索托',
        cities: [
          { code: 'MSU', en: 'Maseru', zh: '马塞卢' },
        ],
      },
      {
        code: 'LR',
        en: 'Liberia',
        zh: '利比里亚',
        cities: [
          { code: 'ROB', en: 'Monrovia', zh: '蒙罗维亚' },
        ],
      },
      {
        code: 'LY',
        en: 'Libya',
        zh: '利比亚',
        cities: [
          { code: 'TIP', en: 'Tripoli', zh: '的黎波里' },
          { code: 'BEN', en: 'Benghazi', zh: '班加西' },
        ],
      },
      {
        code: 'MG',
        en: 'Madagascar',
        zh: '马达加斯加',
        cities: [
          { code: 'TNR', en: 'Antananarivo', zh: '塔那那利佛' },
        ],
      },
      {
        code: 'MW',
        en: 'Malawi',
        zh: '马拉维',
        cities: [
          { code: 'LLW', en: 'Lilongwe', zh: '利隆圭' },
          { code: 'BLZ', en: 'Blantyre', zh: '布兰太尔' },
        ],
      },
      {
        code: 'ML',
        en: 'Mali',
        zh: '马里',
        cities: [
          { code: 'BKO', en: 'Bamako', zh: '巴马科' },
        ],
      },
      {
        code: 'MR',
        en: 'Mauritania',
        zh: '毛里塔尼亚',
        cities: [
          { code: 'NKC', en: 'Nouakchott', zh: '努瓦克肖特' },
        ],
      },
      {
        code: 'MU',
        en: 'Mauritius',
        zh: '毛里求斯',
        cities: [
          { code: 'MRU', en: 'Port Louis', zh: '路易港' },
        ],
      },
      {
        code: 'MA',
        en: 'Morocco',
        zh: '摩洛哥',
        cities: [
          { code: 'RBA', en: 'Rabat', zh: '拉巴特' },
          { code: 'CMN', en: 'Casablanca', zh: '卡萨布兰卡' },
          { code: 'RAK', en: 'Marrakech', zh: '马拉喀什' },
          { code: 'FEZ', en: 'Fez', zh: '非斯' },
          { code: 'TNG', en: 'Tangier', zh: '丹吉尔' },
        ],
      },
      {
        code: 'MZ',
        en: 'Mozambique',
        zh: '莫桑比克',
        cities: [
          { code: 'MPM', en: 'Maputo', zh: '马普托' },
        ],
      },
      {
        code: 'NA',
        en: 'Namibia',
        zh: '纳米比亚',
        cities: [
          { code: 'WDH', en: 'Windhoek', zh: '温得和克' },
        ],
      },
      {
        code: 'NE',
        en: 'Niger',
        zh: '尼日尔',
        cities: [
          { code: 'NIM', en: 'Niamey', zh: '尼亚美' },
        ],
      },
      {
        code: 'NG',
        en: 'Nigeria',
        zh: '尼日利亚',
        cities: [
          { code: 'ABV', en: 'Abuja', zh: '阿布贾' },
          { code: 'LOS', en: 'Lagos', zh: '拉各斯' },
          { code: 'KAN', en: 'Kano', zh: '卡诺' },
          { code: 'PHC', en: 'Port Harcourt', zh: '哈科特港' },
        ],
      },
      {
        code: 'RW',
        en: 'Rwanda',
        zh: '卢旺达',
        cities: [
          { code: 'KGL', en: 'Kigali', zh: '基加利' },
        ],
      },
      {
        code: 'ST',
        en: 'Sao Tome and Principe',
        zh: '圣多美和普林西比',
        cities: [
          { code: 'TMS', en: 'Sao Tome', zh: '圣多美' },
        ],
      },
      {
        code: 'SN',
        en: 'Senegal',
        zh: '塞内加尔',
        cities: [
          { code: 'DSS', en: 'Dakar', zh: '达喀尔' },
        ],
      },
      {
        code: 'SC',
        en: 'Seychelles',
        zh: '塞舌尔',
        cities: [
          { code: 'SEZ', en: 'Victoria', zh: '维多利亚' },
        ],
      },
      {
        code: 'SL',
        en: 'Sierra Leone',
        zh: '塞拉利昂',
        cities: [
          { code: 'FNA', en: 'Freetown', zh: '弗里敦' },
        ],
      },
      {
        code: 'SO',
        en: 'Somalia',
        zh: '索马里',
        cities: [
          { code: 'MGQ', en: 'Mogadishu', zh: '摩加迪沙' },
        ],
      },
      {
        code: 'ZA',
        en: 'South Africa',
        zh: '南非',
        cities: [
          { code: 'PRY', en: 'Pretoria', zh: '比勒陀利亚' },
          { code: 'JNB', en: 'Johannesburg', zh: '约翰内斯堡' },
          { code: 'CPT', en: 'Cape Town', zh: '开普敦' },
          { code: 'DUR', en: 'Durban', zh: '德班' },
          { code: 'PLZ', en: 'Port Elizabeth', zh: '伊丽莎白港' },
        ],
      },
      {
        code: 'SS',
        en: 'South Sudan',
        zh: '南苏丹',
        cities: [
          { code: 'JUB', en: 'Juba', zh: '朱巴' },
        ],
      },
      {
        code: 'SD',
        en: 'Sudan',
        zh: '苏丹',
        cities: [
          { code: 'KRT', en: 'Khartoum', zh: '喀土穆' },
        ],
      },
      {
        code: 'TZ',
        en: 'Tanzania',
        zh: '坦桑尼亚',
        cities: [
          { code: 'DOD', en: 'Dodoma', zh: '多多马' },
          { code: 'DAR', en: 'Dar es Salaam', zh: '达累斯萨拉姆' },
          { code: 'ZNZ', en: 'Zanzibar', zh: '桑给巴尔' },
        ],
      },
      {
        code: 'TG',
        en: 'Togo',
        zh: '多哥',
        cities: [
          { code: 'LFW', en: 'Lome', zh: '洛美' },
        ],
      },
      {
        code: 'TN',
        en: 'Tunisia',
        zh: '突尼斯',
        cities: [
          { code: 'TUN', en: 'Tunis', zh: '突尼斯市' },
          { code: 'SFA', en: 'Sfax', zh: '斯法克斯' },
        ],
      },
      {
        code: 'UG',
        en: 'Uganda',
        zh: '乌干达',
        cities: [
          { code: 'EBB', en: 'Kampala', zh: '坎帕拉' },
        ],
      },
      {
        code: 'ZM',
        en: 'Zambia',
        zh: '赞比亚',
        cities: [
          { code: 'LUN', en: 'Lusaka', zh: '卢萨卡' },
        ],
      },
      {
        code: 'ZW',
        en: 'Zimbabwe',
        zh: '津巴布韦',
        cities: [
          { code: 'HRE', en: 'Harare', zh: '哈拉雷' },
          { code: 'BUQ', en: 'Bulawayo', zh: '布拉瓦约' },
        ],
      },
    ],
  },

  // ============================================================
  // OCEANIA (大洋洲)
  // ============================================================
  {
    code: 'OC',
    en: 'Oceania',
    zh: '大洋洲',
    countries: [
      {
        code: 'AU',
        en: 'Australia',
        zh: '澳大利亚',
        cities: [
          { code: 'CBR', en: 'Canberra', zh: '堪培拉' },
          { code: 'SYD', en: 'Sydney', zh: '悉尼' },
          { code: 'MEL', en: 'Melbourne', zh: '墨尔本' },
          { code: 'BNE', en: 'Brisbane', zh: '布里斯班' },
          { code: 'PER', en: 'Perth', zh: '珀斯' },
          { code: 'ADL', en: 'Adelaide', zh: '阿德莱德' },
          { code: 'DRW', en: 'Darwin', zh: '达尔文' },
          { code: 'HBA', en: 'Hobart', zh: '霍巴特' },
          { code: 'OOL', en: 'Gold Coast', zh: '黄金海岸' },
        ],
      },
      {
        code: 'FJ',
        en: 'Fiji',
        zh: '斐济',
        cities: [
          { code: 'SUV', en: 'Suva', zh: '苏瓦' },
          { code: 'NAN', en: 'Nadi', zh: '楠迪' },
        ],
      },
      {
        code: 'KI',
        en: 'Kiribati',
        zh: '基里巴斯',
        cities: [
          { code: 'TRW', en: 'Tarawa', zh: '塔拉瓦' },
        ],
      },
      {
        code: 'MH',
        en: 'Marshall Islands',
        zh: '马绍尔群岛',
        cities: [
          { code: 'MAJ', en: 'Majuro', zh: '马朱罗' },
        ],
      },
      {
        code: 'FM',
        en: 'Micronesia',
        zh: '密克罗尼西亚',
        cities: [
          { code: 'PLK', en: 'Palikir', zh: '帕利基尔' },
        ],
      },
      {
        code: 'NR',
        en: 'Nauru',
        zh: '瑙鲁',
        cities: [
          { code: 'YRN', en: 'Yaren', zh: '亚伦' },
        ],
      },
      {
        code: 'NZ',
        en: 'New Zealand',
        zh: '新西兰',
        cities: [
          { code: 'WLG', en: 'Wellington', zh: '惠灵顿' },
          { code: 'AKL', en: 'Auckland', zh: '奥克兰' },
          { code: 'CHC', en: 'Christchurch', zh: '基督城' },
          { code: 'ZQN', en: 'Queenstown', zh: '皇后镇' },
        ],
      },
      {
        code: 'PW',
        en: 'Palau',
        zh: '帕劳',
        cities: [
          { code: 'ROR', en: 'Ngerulmud', zh: '恩吉鲁穆德' },
        ],
      },
      {
        code: 'PG',
        en: 'Papua New Guinea',
        zh: '巴布亚新几内亚',
        cities: [
          { code: 'POM', en: 'Port Moresby', zh: '莫尔兹比港' },
        ],
      },
      {
        code: 'WS',
        en: 'Samoa',
        zh: '萨摩亚',
        cities: [
          { code: 'APW', en: 'Apia', zh: '阿皮亚' },
        ],
      },
      {
        code: 'SB',
        en: 'Solomon Islands',
        zh: '所罗门群岛',
        cities: [
          { code: 'HIR', en: 'Honiara', zh: '霍尼亚拉' },
        ],
      },
      {
        code: 'TO',
        en: 'Tonga',
        zh: '汤加',
        cities: [
          { code: 'TBU', en: "Nuku'alofa", zh: '努库阿洛法' },
        ],
      },
      {
        code: 'TV',
        en: 'Tuvalu',
        zh: '图瓦卢',
        cities: [
          { code: 'FUN', en: 'Funafuti', zh: '富纳富提' },
        ],
      },
      {
        code: 'VU',
        en: 'Vanuatu',
        zh: '瓦努阿图',
        cities: [
          { code: 'VLI', en: 'Port Vila', zh: '维拉港' },
        ],
      },
    ],
  },
]

/** Lookup helpers */
export function findContinent(code: string) {
  return GEO_DATA.find((c) => c.code === code)
}

export function findCountry(continentCode: string, countryCode: string) {
  return findContinent(continentCode)?.countries.find((c) => c.code === countryCode)
}

export function findCity(continentCode: string, countryCode: string, cityCode: string) {
  return findCountry(continentCode, countryCode)?.cities.find((c) => c.code === cityCode)
}

/** Get localized name */
export function geoName(item: { en: string; zh: string }, lang: string): string {
  return lang === 'zh' ? item.zh : item.en
}
