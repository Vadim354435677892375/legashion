// Телефонные коды стран (ISO 3166-1 alpha-2 + русское название + код звонка + возможные
// длины обычного номера без кода страны — только мобильные/городские,
// без спецформатов вроде горячих линий 8-800. Напр. Россия: [10], Грузия: [9].
// Сгенерировано из библиотеки Google libphonenumber (через python-пакет phonenumbers).
// Россия — первая в списке и код по умолчанию (стандарт для этого магазина).
export const PHONE_CODES = [
  {
    "code": "RU",
    "name": "Россия",
    "callingCode": "7",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "AU",
    "name": "Австралия",
    "callingCode": "61",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "AT",
    "name": "Австрия",
    "callingCode": "43",
    "possibleLengths": [
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13
    ]
  },
  {
    "code": "AZ",
    "name": "Азербайджан",
    "callingCode": "994",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "AX",
    "name": "Аландские о-ва",
    "callingCode": "358",
    "possibleLengths": [
      6,
      7,
      8,
      9,
      10
    ]
  },
  {
    "code": "AL",
    "name": "Албания",
    "callingCode": "355",
    "possibleLengths": [
      8,
      9
    ]
  },
  {
    "code": "DZ",
    "name": "Алжир",
    "callingCode": "213",
    "possibleLengths": [
      8,
      9
    ]
  },
  {
    "code": "AS",
    "name": "Американское Самоа",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "AI",
    "name": "Ангилья",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "AO",
    "name": "Ангола",
    "callingCode": "244",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "AD",
    "name": "Андорра",
    "callingCode": "376",
    "possibleLengths": [
      6,
      9
    ]
  },
  {
    "code": "AG",
    "name": "Антигуа и Барбуда",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "AR",
    "name": "Аргентина",
    "callingCode": "54",
    "possibleLengths": [
      10,
      11
    ]
  },
  {
    "code": "AM",
    "name": "Армения",
    "callingCode": "374",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "AW",
    "name": "Аруба",
    "callingCode": "297",
    "possibleLengths": [
      7
    ]
  },
  {
    "code": "AF",
    "name": "Афганистан",
    "callingCode": "93",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "BS",
    "name": "Багамы",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "BD",
    "name": "Бангладеш",
    "callingCode": "880",
    "possibleLengths": [
      6,
      7,
      8,
      9,
      10
    ]
  },
  {
    "code": "BB",
    "name": "Барбадос",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "BH",
    "name": "Бахрейн",
    "callingCode": "973",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "BY",
    "name": "Беларусь",
    "callingCode": "375",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "BZ",
    "name": "Белиз",
    "callingCode": "501",
    "possibleLengths": [
      7
    ]
  },
  {
    "code": "BE",
    "name": "Бельгия",
    "callingCode": "32",
    "possibleLengths": [
      8,
      9
    ]
  },
  {
    "code": "BJ",
    "name": "Бенин",
    "callingCode": "229",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "BM",
    "name": "Бермудские о-ва",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "BG",
    "name": "Болгария",
    "callingCode": "359",
    "possibleLengths": [
      6,
      7,
      8,
      9
    ]
  },
  {
    "code": "BO",
    "name": "Боливия",
    "callingCode": "591",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "BQ",
    "name": "Бонэйр, Синт-Эстатиус и Саба",
    "callingCode": "599",
    "possibleLengths": [
      7
    ]
  },
  {
    "code": "BA",
    "name": "Босния и Герцеговина",
    "callingCode": "387",
    "possibleLengths": [
      8,
      9
    ]
  },
  {
    "code": "BW",
    "name": "Ботсвана",
    "callingCode": "267",
    "possibleLengths": [
      7,
      8
    ]
  },
  {
    "code": "BR",
    "name": "Бразилия",
    "callingCode": "55",
    "possibleLengths": [
      10,
      11
    ]
  },
  {
    "code": "IO",
    "name": "Британская территория в Индийском океане",
    "callingCode": "246",
    "possibleLengths": [
      7
    ]
  },
  {
    "code": "BN",
    "name": "Бруней",
    "callingCode": "673",
    "possibleLengths": [
      7
    ]
  },
  {
    "code": "BF",
    "name": "Буркина-Фасо",
    "callingCode": "226",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "BI",
    "name": "Бурунди",
    "callingCode": "257",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "BT",
    "name": "Бутан",
    "callingCode": "975",
    "possibleLengths": [
      7,
      8
    ]
  },
  {
    "code": "VU",
    "name": "Вануату",
    "callingCode": "678",
    "possibleLengths": [
      5,
      7
    ]
  },
  {
    "code": "VA",
    "name": "Ватикан",
    "callingCode": "39",
    "possibleLengths": [
      6,
      7,
      8,
      9,
      10,
      11
    ]
  },
  {
    "code": "GB",
    "name": "Великобритания",
    "callingCode": "44",
    "possibleLengths": [
      9,
      10
    ]
  },
  {
    "code": "HU",
    "name": "Венгрия",
    "callingCode": "36",
    "possibleLengths": [
      8,
      9
    ]
  },
  {
    "code": "VE",
    "name": "Венесуэла",
    "callingCode": "58",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "VG",
    "name": "Виргинские о-ва (Великобритания)",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "VI",
    "name": "Виргинские о-ва (США)",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "TL",
    "name": "Восточный Тимор",
    "callingCode": "670",
    "possibleLengths": [
      7,
      8
    ]
  },
  {
    "code": "VN",
    "name": "Вьетнам",
    "callingCode": "84",
    "possibleLengths": [
      9,
      10
    ]
  },
  {
    "code": "GA",
    "name": "Габон",
    "callingCode": "241",
    "possibleLengths": [
      7,
      8
    ]
  },
  {
    "code": "HT",
    "name": "Гаити",
    "callingCode": "509",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "GY",
    "name": "Гайана",
    "callingCode": "592",
    "possibleLengths": [
      7
    ]
  },
  {
    "code": "GM",
    "name": "Гамбия",
    "callingCode": "220",
    "possibleLengths": [
      7
    ]
  },
  {
    "code": "GH",
    "name": "Гана",
    "callingCode": "233",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "GP",
    "name": "Гваделупа",
    "callingCode": "590",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "GT",
    "name": "Гватемала",
    "callingCode": "502",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "GN",
    "name": "Гвинея",
    "callingCode": "224",
    "possibleLengths": [
      8,
      9
    ]
  },
  {
    "code": "GW",
    "name": "Гвинея-Бисау",
    "callingCode": "245",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "DE",
    "name": "Германия",
    "callingCode": "49",
    "possibleLengths": [
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15
    ]
  },
  {
    "code": "GG",
    "name": "Гернси",
    "callingCode": "44",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "GI",
    "name": "Гибралтар",
    "callingCode": "350",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "HN",
    "name": "Гондурас",
    "callingCode": "504",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "HK",
    "name": "Гонконг (САР)",
    "callingCode": "852",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "GD",
    "name": "Гренада",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "GL",
    "name": "Гренландия",
    "callingCode": "299",
    "possibleLengths": [
      6
    ]
  },
  {
    "code": "GR",
    "name": "Греция",
    "callingCode": "30",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "GE",
    "name": "Грузия",
    "callingCode": "995",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "GU",
    "name": "Гуам",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "DK",
    "name": "Дания",
    "callingCode": "45",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "JE",
    "name": "Джерси",
    "callingCode": "44",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "DJ",
    "name": "Джибути",
    "callingCode": "253",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "DM",
    "name": "Доминика",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "DO",
    "name": "Доминиканская Республика",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "EG",
    "name": "Египет",
    "callingCode": "20",
    "possibleLengths": [
      8,
      9,
      10
    ]
  },
  {
    "code": "ZM",
    "name": "Замбия",
    "callingCode": "260",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "EH",
    "name": "Западная Сахара",
    "callingCode": "212",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "ZW",
    "name": "Зимбабве",
    "callingCode": "263",
    "possibleLengths": [
      5,
      6,
      7,
      8,
      9,
      10
    ]
  },
  {
    "code": "IL",
    "name": "Израиль",
    "callingCode": "972",
    "possibleLengths": [
      8,
      9,
      11,
      12
    ]
  },
  {
    "code": "IN",
    "name": "Индия",
    "callingCode": "91",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "ID",
    "name": "Индонезия",
    "callingCode": "62",
    "possibleLengths": [
      7,
      8,
      9,
      10,
      11,
      12
    ]
  },
  {
    "code": "JO",
    "name": "Иордания",
    "callingCode": "962",
    "possibleLengths": [
      8,
      9
    ]
  },
  {
    "code": "IQ",
    "name": "Ирак",
    "callingCode": "964",
    "possibleLengths": [
      8,
      9,
      10
    ]
  },
  {
    "code": "IR",
    "name": "Иран",
    "callingCode": "98",
    "possibleLengths": [
      6,
      7,
      10
    ]
  },
  {
    "code": "IE",
    "name": "Ирландия",
    "callingCode": "353",
    "possibleLengths": [
      7,
      8,
      9,
      10
    ]
  },
  {
    "code": "IS",
    "name": "Исландия",
    "callingCode": "354",
    "possibleLengths": [
      7,
      9
    ]
  },
  {
    "code": "ES",
    "name": "Испания",
    "callingCode": "34",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "IT",
    "name": "Италия",
    "callingCode": "39",
    "possibleLengths": [
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ]
  },
  {
    "code": "YE",
    "name": "Йемен",
    "callingCode": "967",
    "possibleLengths": [
      7,
      8,
      9
    ]
  },
  {
    "code": "KP",
    "name": "КНДР",
    "callingCode": "850",
    "possibleLengths": [
      8,
      10
    ]
  },
  {
    "code": "CV",
    "name": "Кабо-Верде",
    "callingCode": "238",
    "possibleLengths": [
      7
    ]
  },
  {
    "code": "KZ",
    "name": "Казахстан",
    "callingCode": "7",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "KH",
    "name": "Камбоджа",
    "callingCode": "855",
    "possibleLengths": [
      8,
      9
    ]
  },
  {
    "code": "CM",
    "name": "Камерун",
    "callingCode": "237",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "CA",
    "name": "Канада",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "QA",
    "name": "Катар",
    "callingCode": "974",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "KE",
    "name": "Кения",
    "callingCode": "254",
    "possibleLengths": [
      7,
      8,
      9
    ]
  },
  {
    "code": "CY",
    "name": "Кипр",
    "callingCode": "357",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "KG",
    "name": "Киргизия",
    "callingCode": "996",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "KI",
    "name": "Кирибати",
    "callingCode": "686",
    "possibleLengths": [
      5,
      8
    ]
  },
  {
    "code": "CN",
    "name": "Китай",
    "callingCode": "86",
    "possibleLengths": [
      7,
      8,
      9,
      10,
      11
    ]
  },
  {
    "code": "CC",
    "name": "Кокосовые о-ва",
    "callingCode": "61",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "CO",
    "name": "Колумбия",
    "callingCode": "57",
    "possibleLengths": [
      8,
      10
    ]
  },
  {
    "code": "KM",
    "name": "Коморы",
    "callingCode": "269",
    "possibleLengths": [
      7
    ]
  },
  {
    "code": "CG",
    "name": "Конго - Браззавиль",
    "callingCode": "242",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "CD",
    "name": "Конго - Киншаса",
    "callingCode": "243",
    "possibleLengths": [
      7,
      8,
      9,
      10
    ]
  },
  {
    "code": "XK",
    "name": "Косово",
    "callingCode": "383",
    "possibleLengths": [
      8,
      9,
      10,
      11,
      12
    ]
  },
  {
    "code": "CR",
    "name": "Коста-Рика",
    "callingCode": "506",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "CI",
    "name": "Кот-д’Ивуар",
    "callingCode": "225",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "CU",
    "name": "Куба",
    "callingCode": "53",
    "possibleLengths": [
      6,
      7,
      8,
      10
    ]
  },
  {
    "code": "KW",
    "name": "Кувейт",
    "callingCode": "965",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "CW",
    "name": "Кюрасао",
    "callingCode": "599",
    "possibleLengths": [
      7,
      8
    ]
  },
  {
    "code": "LA",
    "name": "Лаос",
    "callingCode": "856",
    "possibleLengths": [
      8,
      9,
      10
    ]
  },
  {
    "code": "LV",
    "name": "Латвия",
    "callingCode": "371",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "LS",
    "name": "Лесото",
    "callingCode": "266",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "LR",
    "name": "Либерия",
    "callingCode": "231",
    "possibleLengths": [
      7,
      8,
      9
    ]
  },
  {
    "code": "LB",
    "name": "Ливан",
    "callingCode": "961",
    "possibleLengths": [
      7,
      8
    ]
  },
  {
    "code": "LY",
    "name": "Ливия",
    "callingCode": "218",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "LT",
    "name": "Литва",
    "callingCode": "370",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "LI",
    "name": "Лихтенштейн",
    "callingCode": "423",
    "possibleLengths": [
      7,
      9
    ]
  },
  {
    "code": "LU",
    "name": "Люксембург",
    "callingCode": "352",
    "possibleLengths": [
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11
    ]
  },
  {
    "code": "MU",
    "name": "Маврикий",
    "callingCode": "230",
    "possibleLengths": [
      7,
      8
    ]
  },
  {
    "code": "MR",
    "name": "Мавритания",
    "callingCode": "222",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "MG",
    "name": "Мадагаскар",
    "callingCode": "261",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "YT",
    "name": "Майотта",
    "callingCode": "262",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "MO",
    "name": "Макао (САР)",
    "callingCode": "853",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "MW",
    "name": "Малави",
    "callingCode": "265",
    "possibleLengths": [
      7,
      9
    ]
  },
  {
    "code": "MY",
    "name": "Малайзия",
    "callingCode": "60",
    "possibleLengths": [
      8,
      9,
      10
    ]
  },
  {
    "code": "ML",
    "name": "Мали",
    "callingCode": "223",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "MV",
    "name": "Мальдивы",
    "callingCode": "960",
    "possibleLengths": [
      7
    ]
  },
  {
    "code": "MT",
    "name": "Мальта",
    "callingCode": "356",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "MA",
    "name": "Марокко",
    "callingCode": "212",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "MQ",
    "name": "Мартиника",
    "callingCode": "596",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "MH",
    "name": "Маршалловы о-ва",
    "callingCode": "692",
    "possibleLengths": [
      7
    ]
  },
  {
    "code": "MX",
    "name": "Мексика",
    "callingCode": "52",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "MZ",
    "name": "Мозамбик",
    "callingCode": "258",
    "possibleLengths": [
      8,
      9
    ]
  },
  {
    "code": "MD",
    "name": "Молдова",
    "callingCode": "373",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "MC",
    "name": "Монако",
    "callingCode": "377",
    "possibleLengths": [
      8,
      9
    ]
  },
  {
    "code": "MN",
    "name": "Монголия",
    "callingCode": "976",
    "possibleLengths": [
      8,
      9,
      10
    ]
  },
  {
    "code": "MS",
    "name": "Монтсеррат",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "MM",
    "name": "Мьянма (Бирма)",
    "callingCode": "95",
    "possibleLengths": [
      6,
      7,
      8,
      9,
      10
    ]
  },
  {
    "code": "NA",
    "name": "Намибия",
    "callingCode": "264",
    "possibleLengths": [
      8,
      9
    ]
  },
  {
    "code": "NR",
    "name": "Науру",
    "callingCode": "674",
    "possibleLengths": [
      7
    ]
  },
  {
    "code": "NP",
    "name": "Непал",
    "callingCode": "977",
    "possibleLengths": [
      8,
      10
    ]
  },
  {
    "code": "NE",
    "name": "Нигер",
    "callingCode": "227",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "NG",
    "name": "Нигерия",
    "callingCode": "234",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "NL",
    "name": "Нидерланды",
    "callingCode": "31",
    "possibleLengths": [
      9,
      11
    ]
  },
  {
    "code": "NI",
    "name": "Никарагуа",
    "callingCode": "505",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "NU",
    "name": "Ниуэ",
    "callingCode": "683",
    "possibleLengths": [
      4,
      7
    ]
  },
  {
    "code": "NZ",
    "name": "Новая Зеландия",
    "callingCode": "64",
    "possibleLengths": [
      8,
      9,
      10
    ]
  },
  {
    "code": "NC",
    "name": "Новая Каледония",
    "callingCode": "687",
    "possibleLengths": [
      6
    ]
  },
  {
    "code": "NO",
    "name": "Норвегия",
    "callingCode": "47",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "AE",
    "name": "ОАЭ",
    "callingCode": "971",
    "possibleLengths": [
      8,
      9
    ]
  },
  {
    "code": "OM",
    "name": "Оман",
    "callingCode": "968",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "PK",
    "name": "Пакистан",
    "callingCode": "92",
    "possibleLengths": [
      9,
      10
    ]
  },
  {
    "code": "PW",
    "name": "Палау",
    "callingCode": "680",
    "possibleLengths": [
      7
    ]
  },
  {
    "code": "PS",
    "name": "Палестинские территории",
    "callingCode": "970",
    "possibleLengths": [
      8,
      9
    ]
  },
  {
    "code": "PA",
    "name": "Панама",
    "callingCode": "507",
    "possibleLengths": [
      7,
      8
    ]
  },
  {
    "code": "PG",
    "name": "Папуа — Новая Гвинея",
    "callingCode": "675",
    "possibleLengths": [
      7,
      8
    ]
  },
  {
    "code": "PY",
    "name": "Парагвай",
    "callingCode": "595",
    "possibleLengths": [
      7,
      8,
      9
    ]
  },
  {
    "code": "PE",
    "name": "Перу",
    "callingCode": "51",
    "possibleLengths": [
      8,
      9
    ]
  },
  {
    "code": "PL",
    "name": "Польша",
    "callingCode": "48",
    "possibleLengths": [
      7,
      9
    ]
  },
  {
    "code": "PT",
    "name": "Португалия",
    "callingCode": "351",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "PR",
    "name": "Пуэрто-Рико",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "KR",
    "name": "Республика Корея",
    "callingCode": "82",
    "possibleLengths": [
      5,
      6,
      8,
      9,
      10
    ]
  },
  {
    "code": "RE",
    "name": "Реюньон",
    "callingCode": "262",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "RW",
    "name": "Руанда",
    "callingCode": "250",
    "possibleLengths": [
      8,
      9
    ]
  },
  {
    "code": "RO",
    "name": "Румыния",
    "callingCode": "40",
    "possibleLengths": [
      6,
      9
    ]
  },
  {
    "code": "SV",
    "name": "Сальвадор",
    "callingCode": "503",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "WS",
    "name": "Самоа",
    "callingCode": "685",
    "possibleLengths": [
      5,
      6,
      7,
      10
    ]
  },
  {
    "code": "SM",
    "name": "Сан-Марино",
    "callingCode": "378",
    "possibleLengths": [
      8,
      10
    ]
  },
  {
    "code": "ST",
    "name": "Сан-Томе и Принсипи",
    "callingCode": "239",
    "possibleLengths": [
      7
    ]
  },
  {
    "code": "SA",
    "name": "Саудовская Аравия",
    "callingCode": "966",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "MK",
    "name": "Северная Македония",
    "callingCode": "389",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "MP",
    "name": "Северные Марианские о-ва",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "SC",
    "name": "Сейшельские о-ва",
    "callingCode": "248",
    "possibleLengths": [
      7
    ]
  },
  {
    "code": "BL",
    "name": "Сен-Бартелеми",
    "callingCode": "590",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "MF",
    "name": "Сен-Мартен",
    "callingCode": "590",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "PM",
    "name": "Сен-Пьер и Микелон",
    "callingCode": "508",
    "possibleLengths": [
      6,
      9
    ]
  },
  {
    "code": "SN",
    "name": "Сенегал",
    "callingCode": "221",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "VC",
    "name": "Сент-Винсент и Гренадины",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "KN",
    "name": "Сент-Китс и Невис",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "LC",
    "name": "Сент-Люсия",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "RS",
    "name": "Сербия",
    "callingCode": "381",
    "possibleLengths": [
      7,
      8,
      9,
      10,
      11,
      12
    ]
  },
  {
    "code": "SG",
    "name": "Сингапур",
    "callingCode": "65",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "SX",
    "name": "Синт-Мартен",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "SY",
    "name": "Сирия",
    "callingCode": "963",
    "possibleLengths": [
      8,
      9
    ]
  },
  {
    "code": "SK",
    "name": "Словакия",
    "callingCode": "421",
    "possibleLengths": [
      6,
      7,
      9
    ]
  },
  {
    "code": "SI",
    "name": "Словения",
    "callingCode": "386",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "US",
    "name": "Соединенные Штаты",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "SB",
    "name": "Соломоновы о-ва",
    "callingCode": "677",
    "possibleLengths": [
      5,
      7
    ]
  },
  {
    "code": "SO",
    "name": "Сомали",
    "callingCode": "252",
    "possibleLengths": [
      6,
      7,
      8,
      9
    ]
  },
  {
    "code": "SD",
    "name": "Судан",
    "callingCode": "249",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "SR",
    "name": "Суринам",
    "callingCode": "597",
    "possibleLengths": [
      6,
      7
    ]
  },
  {
    "code": "SL",
    "name": "Сьерра-Леоне",
    "callingCode": "232",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "TJ",
    "name": "Таджикистан",
    "callingCode": "992",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "TH",
    "name": "Таиланд",
    "callingCode": "66",
    "possibleLengths": [
      8,
      9
    ]
  },
  {
    "code": "TW",
    "name": "Тайвань",
    "callingCode": "886",
    "possibleLengths": [
      8,
      9
    ]
  },
  {
    "code": "TZ",
    "name": "Танзания",
    "callingCode": "255",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "TG",
    "name": "Того",
    "callingCode": "228",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "TK",
    "name": "Токелау",
    "callingCode": "690",
    "possibleLengths": [
      4,
      5,
      6,
      7
    ]
  },
  {
    "code": "TO",
    "name": "Тонга",
    "callingCode": "676",
    "possibleLengths": [
      5,
      7
    ]
  },
  {
    "code": "TT",
    "name": "Тринидад и Тобаго",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "TV",
    "name": "Тувалу",
    "callingCode": "688",
    "possibleLengths": [
      5,
      6,
      7
    ]
  },
  {
    "code": "TN",
    "name": "Тунис",
    "callingCode": "216",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "TM",
    "name": "Туркменистан",
    "callingCode": "993",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "TR",
    "name": "Турция",
    "callingCode": "90",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "TC",
    "name": "Тёркс и Кайкос",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "UG",
    "name": "Уганда",
    "callingCode": "256",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "UZ",
    "name": "Узбекистан",
    "callingCode": "998",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "UA",
    "name": "Украина",
    "callingCode": "380",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "WF",
    "name": "Уоллис и Футуна",
    "callingCode": "681",
    "possibleLengths": [
      6
    ]
  },
  {
    "code": "UY",
    "name": "Уругвай",
    "callingCode": "598",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "FO",
    "name": "Фарерские о-ва",
    "callingCode": "298",
    "possibleLengths": [
      6
    ]
  },
  {
    "code": "FM",
    "name": "Федеративные Штаты Микронезии",
    "callingCode": "691",
    "possibleLengths": [
      7
    ]
  },
  {
    "code": "FJ",
    "name": "Фиджи",
    "callingCode": "679",
    "possibleLengths": [
      7
    ]
  },
  {
    "code": "PH",
    "name": "Филиппины",
    "callingCode": "63",
    "possibleLengths": [
      6,
      8,
      9,
      10
    ]
  },
  {
    "code": "FI",
    "name": "Финляндия",
    "callingCode": "358",
    "possibleLengths": [
      5,
      6,
      7,
      8,
      9,
      10
    ]
  },
  {
    "code": "FK",
    "name": "Фолклендские о-ва",
    "callingCode": "500",
    "possibleLengths": [
      5
    ]
  },
  {
    "code": "FR",
    "name": "Франция",
    "callingCode": "33",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "GF",
    "name": "Французская Гвиана",
    "callingCode": "594",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "PF",
    "name": "Французская Полинезия",
    "callingCode": "689",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "HR",
    "name": "Хорватия",
    "callingCode": "385",
    "possibleLengths": [
      8,
      9
    ]
  },
  {
    "code": "CF",
    "name": "Центрально-Африканская Республика",
    "callingCode": "236",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "TD",
    "name": "Чад",
    "callingCode": "235",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "ME",
    "name": "Черногория",
    "callingCode": "382",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "CZ",
    "name": "Чехия",
    "callingCode": "420",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "CL",
    "name": "Чили",
    "callingCode": "56",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "CH",
    "name": "Швейцария",
    "callingCode": "41",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "SE",
    "name": "Швеция",
    "callingCode": "46",
    "possibleLengths": [
      7,
      8,
      9
    ]
  },
  {
    "code": "SJ",
    "name": "Шпицберген и Ян-Майен",
    "callingCode": "47",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "LK",
    "name": "Шри-Ланка",
    "callingCode": "94",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "EC",
    "name": "Эквадор",
    "callingCode": "593",
    "possibleLengths": [
      8,
      9
    ]
  },
  {
    "code": "GQ",
    "name": "Экваториальная Гвинея",
    "callingCode": "240",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "ER",
    "name": "Эритрея",
    "callingCode": "291",
    "possibleLengths": [
      7
    ]
  },
  {
    "code": "SZ",
    "name": "Эсватини",
    "callingCode": "268",
    "possibleLengths": [
      8
    ]
  },
  {
    "code": "EE",
    "name": "Эстония",
    "callingCode": "372",
    "possibleLengths": [
      7,
      8
    ]
  },
  {
    "code": "ET",
    "name": "Эфиопия",
    "callingCode": "251",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "ZA",
    "name": "Южно-Африканская Республика",
    "callingCode": "27",
    "possibleLengths": [
      5,
      6,
      7,
      8,
      9
    ]
  },
  {
    "code": "SS",
    "name": "Южный Судан",
    "callingCode": "211",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "JM",
    "name": "Ямайка",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "JP",
    "name": "Япония",
    "callingCode": "81",
    "possibleLengths": [
      9,
      10
    ]
  },
  {
    "code": "IM",
    "name": "о-в Мэн",
    "callingCode": "44",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "NF",
    "name": "о-в Норфолк",
    "callingCode": "672",
    "possibleLengths": [
      6
    ]
  },
  {
    "code": "CX",
    "name": "о-в Рождества",
    "callingCode": "61",
    "possibleLengths": [
      9
    ]
  },
  {
    "code": "SH",
    "name": "о-в Св. Елены",
    "callingCode": "290",
    "possibleLengths": [
      4,
      5
    ]
  },
  {
    "code": "KY",
    "name": "о-ва Кайман",
    "callingCode": "1",
    "possibleLengths": [
      10
    ]
  },
  {
    "code": "CK",
    "name": "о-ва Кука",
    "callingCode": "682",
    "possibleLengths": [
      5
    ]
  }
];

export const DEFAULT_PHONE_CODE = PHONE_CODES[0]; // Россия, +7

// Популярные направления — показываются в выпадающем списке сразу, без ввода текста
// (тот же набор, что и в countries.js: СНГ/ближнее зарубежье + крупные мировые направления).
// Остальные коды по-прежнему доступны через поиск по названию страны или цифрам кода.
export const POPULAR_PHONE_CODE_COUNTRIES = [
  "RU",
  "BY",
  "KZ",
  "AM",
  "KG",
  "UZ",
  "AZ",
  "GE",
  "MD",
  "TJ",
  "TM",
  "DE",
  "US",
  "GB",
  "FR",
  "IT",
  "ES",
  "TR",
  "AE",
  "CN",
  "IL",
  "PL",
  "FI",
  "KR",
  "JP",
  "IN",
  "PT",
  "NL",
  "CZ",
  "TH",
  "VN",
  "BR",
  "CA",
  "AU",
  "CH",
  "SE",
  "AT"
];

const byCode = new Map(PHONE_CODES.map((c) => [c.code, c]));
export const POPULAR_PHONE_CODES = POPULAR_PHONE_CODE_COUNTRIES.map((code) => byCode.get(code)).filter(Boolean);