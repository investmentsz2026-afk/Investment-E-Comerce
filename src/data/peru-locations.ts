/**
 * Estructura geográfica oficial del Perú (Departamentos, Provincias y Distritos).
 * Utilizada para la selección de envíos en checkout y la configuración de tarifas en el panel administrativo.
 */

export interface PeruDepartmentData {
  name: string;
  provinces: {
    name: string;
    districts: string[];
  }[];
}

export const PERU_LOCATIONS: PeruDepartmentData[] = [
  {
    name: "Lima",
    provinces: [
      {
        name: "Lima",
        districts: [
          "Ancón",
          "Ate",
          "Barranco",
          "Breña",
          "Carabayllo",
          "Chaclacayo",
          "Chorrillos",
          "Cieneguilla",
          "Comas",
          "El Agustino",
          "Independencia",
          "Jesús María",
          "La Molina",
          "La Victoria",
          "Lima (Cercado)",
          "Lince",
          "Los Olivos",
          "Lurigancho-Chosica",
          "Lurín",
          "Magdalena del Mar",
          "Miraflores",
          "Pachacámac",
          "Pucusana",
          "Pueblo Libre",
          "Puente Piedra",
          "Punta Hermosa",
          "Punta Negra",
          "Rímac",
          "San Bartolo",
          "San Borja",
          "San Isidro",
          "San Juan de Lurigancho",
          "San Juan de Miraflores",
          "San Luis",
          "San Martín de Porres",
          "San Miguel",
          "Santa Anita",
          "Santa María del Mar",
          "Santa Rosa",
          "Santiago de Surco",
          "Surquillo",
          "Villa El Salvador",
          "Villa María del Triunfo",
        ],
      },
      {
        name: "Barranca",
        districts: ["Barranca", "Paramonga", "Pativilca", "Supe", "Supe Puerto"],
      },
      {
        name: "Cañete",
        districts: [
          "San Vicente de Cañete",
          "Asia",
          "Calango",
          "Cerro Azul",
          "Chilca",
          "Imperial",
          "Lunahuaná",
          "Mala",
          "Nuevo Imperial",
          "Pacarán",
          "Quilmaná",
          "San Antonio",
          "San Luis",
          "Santa Cruz de Flores",
        ],
      },
      {
        name: "Huaral",
        districts: [
          "Huaral",
          "Atavillos Alto",
          "Atavillos Bajo",
          "Aucallama",
          "Chancay",
          "Ihuarí",
          "Lampían",
          "Pacaraos",
          "Santa Cruz de Andamarca",
          "Sumbilca",
          "Veintisiete de Noviembre",
        ],
      },
      {
        name: "Huaura",
        districts: [
          "Huacho",
          "Ámbar",
          "Caleta de Carquín",
          "Checras",
          "Hualmay",
          "Huaura",
          "Leoncio Prado",
          "Paccho",
          "Santa Leonor",
          "Santa María",
          "Sayán",
          "Végueta",
        ],
      },
      {
        name: "Canta",
        districts: ["Canta", "Arahuay", "Huamantanga", "Huaros", "Lachaqui", "San Buenaventura", "Santa Rosa de Quives"],
      },
      {
        name: "Huarochirí",
        districts: ["Matucana", "Antioquía", "Callahuanca", "Chicla", "Ricardo Palma", "San Bartolomé", "San Mateo", "Santa Eulalia"],
      },
      {
        name: "Cajatambo",
        districts: ["Cajatambo", "Copa", "Gorgor", "Huancapón", "Manás"],
      },
      {
        name: "Oyón",
        districts: ["Oyón", "Andajes", "Caujul", "Cochamarca", "Naván", "Pachangara"],
      },
      {
        name: "Yauyos",
        districts: ["Yauyos", "Alis", "Ayauca", "Catahuasi", "Huancaya", "Laraos", "Omas", "Tomas", "Viñac"],
      },
    ],
  },
  {
    name: "Callao",
    provinces: [
      {
        name: "Callao",
        districts: [
          "Callao",
          "Bellavista",
          "Carmen de la Legua Reynoso",
          "La Perla",
          "La Punta",
          "Mi Perú",
          "Ventanilla",
        ],
      },
    ],
  },
  {
    name: "Arequipa",
    provinces: [
      {
        name: "Arequipa",
        districts: [
          "Arequipa",
          "Alto Selva Alegre",
          "Cayma",
          "Cerro Colorado",
          "Characato",
          "Chiguata",
          "Jacobo Hunter",
          "José Luis Bustamante y Rivero",
          "La Joya",
          "Mariano Melgar",
          "Miraflores",
          "Mollebaya",
          "Paucarpata",
          "Pocsi",
          "Polobaya",
          "Quequeña",
          "Sabandía",
          "Sachaca",
          "San Juan de Siguas",
          "San Juan de Tarucani",
          "Santa Isabel de Siguas",
          "Santa Rita de Siguas",
          "Socabaya",
          "Tiabaya",
          "Uchumayo",
          "Vítor",
          "Yanahuara",
          "Yarabamba",
          "Yura",
        ],
      },
      {
        name: "Camaná",
        districts: ["Camaná", "José María Quimper", "Mariano Nicolás Valcárcel", "Mariscal Cáceres", "Nicolás de Piérola", "Ocoña", "Quilca", "Samuel Pastor"],
      },
      {
        name: "Caravelí",
        districts: ["Caravelí", "Acarí", "Atico", "Atiquipa", "Bella Unión", "Cahuacho", "Chala", "Chaparra", "Jaquí", "Lomas", "Quicacha", "Yauca"],
      },
      {
        name: "Castilla",
        districts: ["Aplao", "Andagua", "Ayo", "Chachas", "Chilcaymarca", "Choco", "Huancarqui", "Machaguay", "Orcopampa", "Pampacolca", "Tipán", "Uñón", "Uraca", "Viraco"],
      },
      {
        name: "Caylloma",
        districts: ["Chivay", "Achoma", "Cabanaconde", "Callalli", "Caylloma", "Coporaque", "Huambo", "Huanca", "Ichupampa", "Lari", "Lluta", "Maca", "Madrigal", "San Antonio de Chuca", "Sibayo", "Tapay", "Tisco", "Tuti", "Yanque", "Majes"],
      },
      {
        name: "Condesuyos",
        districts: ["Chuquibamba", "Andaray", "Cayarani", "Chichas", "Iray", "Río Grande", "Salamanca", "Yanaquihua"],
      },
      {
        name: "Islay",
        districts: ["Mollendo", "Cocachacra", "Dean Valdivia", "Islay", "Mejía", "Punta de Bombón"],
      },
      {
        name: "La Unión",
        districts: ["Cotahuasi", "Alca", "Charcana", "Huaynacotas", "Pampamarca", "Puyca", "Quechualla", "Sayla", "Tauría", "Tomepampa", "Toro"],
      },
    ],
  },
  {
    name: "La Libertad",
    provinces: [
      {
        name: "Trujillo",
        districts: [
          "Trujillo",
          "El Porvenir",
          "Florencia de Mora",
          "Huanchaco",
          "La Esperanza",
          "Laredo",
          "Moche",
          "Poroto",
          "Salaverry",
          "Simbal",
          "Víctor Larco Herrera",
        ],
      },
      {
        name: "Ascope",
        districts: ["Ascope", "Chicama", "Chocope", "Magdalena de Cao", "Paiján", "Rázuri", "Santiago de Cao", "Casa Grande"],
      },
      {
        name: "Chepén",
        districts: ["Chepén", "Pacanga", "Pueblo Nuevo"],
      },
      {
        name: "Pacasmayo",
        districts: ["San Pedro de Lloc", "Guadalupe", "Jequetepeque", "Pacasmayo", "San José"],
      },
      {
        name: "Virú",
        districts: ["Virú", "Chao", "Guadalupito"],
      },
      {
        name: "Sánchez Carrión",
        districts: ["Huamachuco", "Chugay", "Cochorco", "Curgos", "Marcabal", "Sanagorán", "Sarín", "Sartimbamba"],
      },
      {
        name: "Otuzco",
        districts: ["Otuzco", "Agallpampa", "Charat", "Huaranchal", "La Cuesta", "Mache", "Paranday", "Salpo", "Sinsicap", "Usquil"],
      },
      {
        name: "Pataz",
        districts: ["Tayabamba", "Buldibuyo", "Chillia", "Huancaspata", "Huaylillas", "Huayo", "Ongón", "Parcoy", "Pataz", "Pías", "Santiago de Challas", "Taurija", "Urpay"],
      },
    ],
  },
  {
    name: "Lambayeque",
    provinces: [
      {
        name: "Chiclayo",
        districts: [
          "Chiclayo",
          "Chongoyape",
          "Eten",
          "Eten Puerto",
          "José Leonardo Ortiz",
          "La Victoria",
          "Lagunas",
          "Monsefú",
          "Nueva Arica",
          "Oyotún",
          "Picsi",
          "Pimentel",
          "Reque",
          "Santa Rosa",
          "Saña",
          "Cayaltí",
          "Pátapo",
          "Pomalca",
          "Pucalá",
          "Tumán",
        ],
      },
      {
        name: "Ferreñafe",
        districts: ["Ferreñafe", "Cañaris", "Incahuasi", "Manuel Antonio Mesones Muro", "Pítipo", "Pueblo Nuevo"],
      },
      {
        name: "Lambayeque",
        districts: ["Lambayeque", "Chochope", "Íllimo", "Jayanca", "Mochumí", "Mórrope", "Motupe", "Olmos", "Pacora", "Salas", "San José", "Túcume"],
      },
    ],
  },
  {
    name: "Piura",
    provinces: [
      {
        name: "Piura",
        districts: [
          "Piura",
          "Castilla",
          "Catacaos",
          "Cura Mori",
          "El Tallán",
          "La Arena",
          "La Unión",
          "Las Lomas",
          "Tambogrande",
          "Veintiséis de Octubre",
        ],
      },
      {
        name: "Sullana",
        districts: ["Sullana", "Bellavista", "Ignacio Escudero", "Lancones", "Marcavelica", "Miguel Checa", "Querecotillo", "Salitral"],
      },
      {
        name: "Talara",
        districts: ["Pariñas", "El Alto", "La Brea", "Lobitos", "Los Órganos", "Máncora"],
      },
      {
        name: "Paita",
        districts: ["Paita", "Amotape", "Arenal", "Colán", "La Huaca", "Tamarindo", "Vichayal"],
      },
      {
        name: "Morropón",
        districts: ["Chulucanas", "Buenos Aires", "Chalaco", "La Matanza", "Morropón", "Salitral", "San Juan de Bigote", "Santa Catalina de Mossa", "Santo Domingo", "Yamango"],
      },
      {
        name: "Sechura",
        districts: ["Sechura", "Bellavista de la Unión", "Bernal", "Cristo Nos Valga", "Vice", "Rinconada Llícuar"],
      },
      {
        name: "Ayabaca",
        districts: ["Ayabaca", "Frías", "Jililí", "Lagunas", "Montero", "Pacaipampa", "Paimas", "Sapillica", "Sicchez", "Suyo"],
      },
      {
        name: "Huancabamba",
        districts: ["Huancabamba", "Canchaque", "El Carmen de la Frontera", "Huarmaca", "Lalaquiz", "San Miguel de El Faique", "Sondor", "Sondorillo"],
      },
    ],
  },
  {
    name: "Cusco",
    provinces: [
      {
        name: "Cusco",
        districts: [
          "Cusco",
          "Ccorca",
          "Poroy",
          "San Jerónimo",
          "San Sebastián",
          "Santiago",
          "Saylla",
          "Wanchaq",
        ],
      },
      {
        name: "Urubamba",
        districts: ["Urubamba", "Chinchero", "Huayllabamba", "Machupicchu", "Maras", "Ollantaytambo", "Yucay"],
      },
      {
        name: "Calca",
        districts: ["Calca", "Coya", "Lamay", "Lares", "Písac", "San Salvador", "Taray", "Yanatile"],
      },
      {
        name: "Anta",
        districts: ["Anta", "Ancahuasi", "Cachimayo", "Chinchaypujio", "Huarocondo", "Limatambo", "Mollepata", "Pucyura", "Zurite"],
      },
      {
        name: "Quispicanchi",
        districts: ["Urcos", "Andahuaylillas", "Camanti", "Ccarhuayo", "Ccatca", "Cusipata", "Huaro", "Lucre", "Marcapata", "Ocongate", "Oropesa", "Quiquijana"],
      },
      {
        name: "Canchis",
        districts: ["Sicuani", "Checca", "Combapata", "Marangani", "Pitumarca", "San Pablo", "San Pedro", "Tinta"],
      },
      {
        name: "La Convención",
        districts: ["Santa Ana (Quillabamba)", "Echarati", "Huayopata", "Maranura", "Ocobamba", "Santa Teresa", "Vilcabamba", "Inkawasi", "Villa Kintiarina", "Megantoni"],
      },
      {
        name: "Espinar",
        districts: ["Yauri", "Condoroma", "Coporaque", "Ocoruro", "Pallpata", "Pichigua", "Suyckutambo", "Alto Pichigua"],
      },
    ],
  },
  {
    name: "Junín",
    provinces: [
      {
        name: "Huancayo",
        districts: [
          "Huancayo",
          "Carhuacallanga",
          "Chacapampa",
          "Chicche",
          "Chilca",
          "Chongos Alto",
          "Chupuro",
          "Colca",
          "Cullhuas",
          "El Tambo",
          "Huacrapuquio",
          "Hualhuas",
          "Huancán",
          "Huasicancha",
          "Huayucachi",
          "Ingenio",
          "Pariahuanca",
          "Pilcomayo",
          "Pucará",
          "Quichuay",
          "Quilcas",
          "San Agustín",
          "San Jerónimo de Tunán",
          "Saño",
          "Santo Domingo de Acobamba",
          "Sapallanga",
          "Sicaya",
          "Viques",
        ],
      },
      {
        name: "Chanchamayo",
        districts: ["Chanchamayo (La Merced)", "Perené", "Pichanaqui", "San Luis de Shuaro", "San Ramón", "Vítoc"],
      },
      {
        name: "Satipo",
        districts: ["Satipo", "Coviriali", "Llaylla", "Mazamari", "Pampa Hermosa", "Pangoa", "Río Negro", "Río Tambo", "Vizcatán del Ene"],
      },
      {
        name: "Tarma",
        districts: ["Tarma", "Acobamba", "Huaricolca", "Huasahuasi", "La Unión", "Palca", "Palcamayo", "San Pedro de Cajas", "Tapo"],
      },
      {
        name: "Jauja",
        districts: ["Jauja", "Acolla", "Apata", "Ataura", "Canchayllo", "Curicaca", "El Mantaro", "Huamalí", "Huaripampa", "Julcán", "Leonor Ordóñez", "Llocllapampa", "Marco", "Masma", "Molinos", "Monobamba", "Muqui", "Muquiyauyo", "Paca", "Paccha", "Pancán", "Ricrán", "San Pedro de Chunán", "Sausa", "Sincos", "Tunan Marca", "Yauli", "Yauyos"],
      },
      {
        name: "Yauli",
        districts: ["La Oroya", "Chacapalpa", "Huay-Huay", "Marcapomacocha", "Morococha", "Paccha", "Santa Bárbara de Carhuacayán", "Santa Rosa de Sacco", "Suitucancha", "Yauli"],
      },
    ],
  },
  {
    name: "Ica",
    provinces: [
      {
        name: "Ica",
        districts: [
          "Ica",
          "La Tinguiña",
          "Los Aquijes",
          "Ocucaje",
          "Pachacútec",
          "Parcona",
          "Pueblo Nuevo",
          "Salas (Guadalupe)",
          "San José de los Molinos",
          "San Juan Bautista",
          "Santiago",
          "Subtanjalla",
          "Tate",
          "Yauca del Rosario",
        ],
      },
      {
        name: "Chincha",
        districts: [
          "Chincha Alta",
          "Alto Larán",
          "Chavín",
          "Chincha Baja",
          "El Carmen",
          "Grocio Prado",
          "Pueblo Nuevo",
          "San Juan de Yanac",
          "San Pedro de Huacarpana",
          "Sunampe",
          "Tambo de Mora",
        ],
      },
      {
        name: "Pisco",
        districts: [
          "Pisco",
          "Huancano",
          "Humay",
          "Independencia",
          "Paracas",
          "San Andrés",
          "San Clemente",
          "Túpac Amaru Inca",
        ],
      },
      {
        name: "Nazca",
        districts: ["Nazca", "Changuillo", "El Ingenio", "Marcona", "Vista Alegre"],
      },
      {
        name: "Palpa",
        districts: ["Palpa", "Llipata", "Río Grande", "Santa Cruz", "Tibillo"],
      },
    ],
  },
  {
    name: "Áncash",
    provinces: [
      {
        name: "Santa",
        districts: ["Chimbote", "Cáceres del Perú", "Coishco", "Macate", "Moro", "Nepeña", "Nuevo Chimbote", "Samanco", "Santa"],
      },
      {
        name: "Huaraz",
        districts: ["Huaraz", "Cochabamba", "Colcabamba", "Huanchay", "Jangas", "La Libertad", "Olleros", "Pampas Grande", "Pariacoto", "Pira", "Tarica", "Independencia"],
      },
      {
        name: "Casma",
        districts: ["Casma", "Buena Vista Alta", "Comandante Noel", "Yaután"],
      },
      {
        name: "Huarmey",
        districts: ["Huarmey", "Cochapeti", "Culebras", "Huayán", "Malvas"],
      },
      {
        name: "Carhuaz",
        districts: ["Carhuaz", "Acopampa", "Amashca", "Anta", "Ataquero", "Marcara", "Pariahuanca", "San Miguel de Aco", "Shilla", "Tinco", "Yungar"],
      },
      {
        name: "Yungay",
        districts: ["Yungay", "Cascapara", "Mancos", "Matacoto", "Quillo", "Ranrahirca", "Shupluy", "Yanama"],
      },
      {
        name: "Huari",
        districts: ["Huari", "Anra", "Cajay", "Chavín de Huántar", "Huacachi", "Huacchis", "Huachis", "Huantar", "Masin", "Paucas", "Pontó", "Rahuapampa", "Rapayan", "San Marcos", "San Pedro de Chaná", "Uco"],
      },
    ],
  },
  {
    name: "Cajamarca",
    provinces: [
      {
        name: "Cajamarca",
        districts: ["Cajamarca", "Asunción", "Chetilla", "Cospán", "Encañada", "Jesús", "Llacanora", "Los Baños del Inca", "Magdalena", "Matara", "Namora", "San Juan"],
      },
      {
        name: "Jaén",
        districts: ["Jaén", "Bellavista", "Chontalí", "Colasay", "Huabal", "Las Pirias", "Pomahuaca", "Pucará", "Sallique", "San Felipe", "San José del Alto", "Santa Rosa"],
      },
      {
        name: "Chota",
        districts: ["Chota", "Anguía", "Chadin", "Chiguirip", "Chimban", "Choropampa", "Cochabamba", "Conchán", "Huambos", "Lajas", "Llama", "Miracosta", "Paccha", "Pion", "Querocoto", "San Juan de Licupis", "Tacabamba", "Tocmoche", "Chalamarca"],
      },
      {
        name: "Cutervo",
        districts: ["Cutervo", "Callayuc", "Choros", "Cujillo", "La Ramada", "Pimpingos", "Querocotillo", "San Andrés de Cutervo", "San Juan de Cutervo", "San Luis de Lucma", "Santa Cruz", "Santo Domingo de la Capilla", "Santo Tomás", "Socota", "Toribio Casanova"],
      },
    ],
  },
  {
    name: "San Martín",
    provinces: [
      {
        name: "San Martín",
        districts: ["Tarapoto", "Alberto Leveau", "Cacatachi", "Chazuta", "Chipurana", "El Porvenir", "Huimbayoc", "Juan Guerra", "La Banda de Shilcayo", "Morales", "Papaplaya", "San Antonio", "Sauce", "Shapaja"],
      },
      {
        name: "Moyobamba",
        districts: ["Moyobamba", "Calzada", "Habana", "Jepelacio", "Soritor", "Yantaló"],
      },
      {
        name: "Rioja",
        districts: ["Rioja", "Awajún", "Elias Soplín Vargas", "Nueva Cajamarca", "Pardo Miguel", "Posic", "San Fernando", "Yorongos", "Yuracyacu"],
      },
      {
        name: "Tocache",
        districts: ["Tocache", "Nuevo Progreso", "Pólvora", "Shunté", "Uchiza", "Santa Lucía"],
      },
    ],
  },
  {
    name: "Loreto",
    provinces: [
      {
        name: "Maynas",
        districts: ["Iquitos", "Alto Nanay", "Fernando Lores", "Indiana", "Las Amazonas", "Mazan", "Napo", "Punchana", "Torres Causana", "Belén", "San Juan Bautista"],
      },
      {
        name: "Alto Amazonas",
        districts: ["Yurimaguas", "Balsapuerto", "Jeberos", "Lagunas", "Santa Cruz", "Teniente César López Rojas"],
      },
      {
        name: "Loreto",
        districts: ["Nauta", "Parinari", "Tigre", "Trompeteros", "Urarinas"],
      },
      {
        name: "Putumayo",
        districts: ["Putumayo", "Rosa Panduro", "Yaguas", "Teniente Manuel Clavero"],
      },
    ],
  },
  {
    name: "Ucayali",
    provinces: [
      {
        name: "Coronel Portillo",
        districts: ["Callería (Pucallpa)", "Campoverde", "Iparía", "Masisea", "Yarinacocha", "Nueva Requena", "Manantay"],
      },
      {
        name: "Padre Abad",
        districts: ["Padre Abad (Aguaytía)", "Irazola", "Curimaná", "Neshuya", "Alexander Von Humboldt", "Boquerón"],
      },
      {
        name: "Atalaya",
        districts: ["Raimondi (Atalaya)", "Sepahua", "Tahuanía", "Yurúa"],
      },
    ],
  },
  {
    name: "Puno",
    provinces: [
      {
        name: "Puno",
        districts: ["Puno", "Acora", "Amantaní", "Atuncolla", "Capachica", "Chucuito", "Coata", "Huata", "Mañazo", "Paucarcolla", "Pichacani", "Platería", "San Antonio", "Tiquillaca", "Vilque"],
      },
      {
        name: "San Román",
        districts: ["Juliaca", "Cabana", "Cabanillas", "Caracoto", "San Miguel"],
      },
      {
        name: "Chucuito",
        districts: ["Juli", "Desaguadero", "Huacullani", "Kelluyo", "Pisacoma", "Pomata", "Zepita"],
      },
      {
        name: "Melgar",
        districts: ["Ayaviri", "Antauta", "Cupi", "Llalli", "Macari", "Nuñoa", "Orurillo", "Santa Rosa", "Umachiri"],
      },
    ],
  },
  {
    name: "Tacna",
    provinces: [
      {
        name: "Tacna",
        districts: ["Tacna", "Alto de la Alianza", "Calana", "Ciudad Nueva", "Inclán", "Pachía", "Palca", "Pocollay", "Sama", "Coronel Gregorio Albarracín Lanchipa", "La Yarada-Los Palos"],
      },
      {
        name: "Jorge Basadre",
        districts: ["Locumba", "Ilabaya", "Ite"],
      },
      {
        name: "Tarata",
        districts: ["Tarata", "Chucatamani", "Estique", "Estique-Pampa", "Sitajara", "Susapaya", "Tarucachi", "Ticaco"],
      },
    ],
  },
  {
    name: "Moquegua",
    provinces: [
      {
        name: "Mariscal Nieto",
        districts: ["Moquegua", "Carumas", "Cuchumbaya", "Samegua", "San Cristóbal", "Torata"],
      },
      {
        name: "Ilo",
        districts: ["Ilo", "El Algarrobal", "Pacocha"],
      },
      {
        name: "General Sánchez Cerro",
        districts: ["Omate", "Chojata", "Coalaque", "Ichuña", "La Capilla", "Lloque", "Matalaque", "Puquina", "Quinistaquillas", "Ubinas", "Yunga"],
      },
    ],
  },
  {
    name: "Huánuco",
    provinces: [
      {
        name: "Huánuco",
        districts: ["Huánuco", "Amarilis", "Chinchao", "Churubamba", "Margos", "Quisqui", "San Francisco de Cayrán", "San Pedro de Chaulán", "Santa María del Valle", "Yarumayo", "Pillco Marca", "Yacus", "San Pablo de Pillao"],
      },
      {
        name: "Leoncio Prado",
        districts: ["Rupa-Rupa (Tingo María)", "Daniel Alomía Robles", "Hermilio Valdizán", "José Crespo y Castillo (Aucayacu)", "Luyando", "Mariano Dámaso Beraún", "Pucayacu", "Castillo Grande", "Pueblo Nuevo", "Santo Domingo de Anda"],
      },
    ],
  },
  {
    name: "Ayacucho",
    provinces: [
      {
        name: "Huamanga",
        districts: ["Ayacucho", "Acocro", "Acos Vinchos", "Carmen Alto", "Chiara", "Ocros", "Pacaycasa", "Quinua", "San José de Ticllas", "San Juan Bautista", "Santiago de Pischa", "Socos", "Tambillo", "Vinchos", "Jesús Nazareno", "Andrés Avelino Cáceres Dorregaray"],
      },
      {
        name: "Huanta",
        districts: ["Huanta", "Ayahuanco", "Huamanguilla", "Iguain", "Luricocha", "Santillana", "Sivia", "Llochegua", "Canayre", "Uchuraccay", "Pucacolpa", "Chaca"],
      },
    ],
  },
  {
    name: "Amazonas",
    provinces: [
      {
        name: "Chachapoyas",
        districts: ["Chachapoyas", "Asunción", "Balsas", "Cheto", "Chiliquin", "Chuquibamba", "Granada", "Huancas", "La Jalca", "Leimebamba", "Levanto", "Magdalena", "Mariscal Castilla", "Molinopampa", "Montevideo", "Olleros", "Quinjalca", "San Francisco de Daguas", "San Isidro de Maino", "Soloco", "Sonche"],
      },
      {
        name: "Bagua",
        districts: ["Bagua", "Aramango", "Copallin", "El Parco", "Imaza", "La Peca"],
      },
      {
        name: "Utcubamba",
        districts: ["Bagua Grande", "Cajaruro", "Cumba", "El Milagro", "Jamalca", "Lonya Grande", "Yambrasbamba"],
      },
    ],
  },
  {
    name: "Apurímac",
    provinces: [
      {
        name: "Abancay",
        districts: ["Abancay", "Chacoche", "Circa", "Curahuasi", "Huanipaca", "Lambrama", "Pichirhua", "San Pedro de Cachora", "Tamburco"],
      },
      {
        name: "Andahuaylas",
        districts: ["Andahuaylas", "Andarapa", "Chiara", "Huancarama", "Huancaray", "Huayana", "Kishuará", "Pacobamba", "Pacucha", "Pampachiri", "Pomacocha", "San Antonio de Cachi", "San Jerónimo", "San Miguel de Chaccrampa", "Santa María de Chicmo", "Talavera", "Tumay Huaraca", "Turpo", "Kaquiabamba", "José María Arguedas"],
      },
    ],
  },
  {
    name: "Huancavelica",
    provinces: [
      {
        name: "Huancavelica",
        districts: ["Huancavelica", "Acobambilla", "Acoria", "Conayca", "Cuenca", "Huachocolpa", "Huayllahuara", "Izcuchaca", "Laria", "Manta", "Mariscal Cáceres", "Moya", "Nuevo Occoro", "Palca", "Pilchaca", "Vilca", "Yauli", "Ascensión", "Huando"],
      },
      {
        name: "Tayacaja",
        districts: ["Pampas", "Acostambo", "Acraquia", "Ahuaycha", "Colcabamba", "Daniel Hernández", "Huachocolpa", "Huaribamba", "Ñahuimpuquio", "Pazos", "Quishuar", "Salcabamba", "Salcahuasi", "San Marcos de Rocchac", "Surcubamba", "Tintay Puncu", "Quichuas", "Andaymarca", "Roble", "Pichos", "Santiago de Tucuma"],
      },
    ],
  },
  {
    name: "Pasco",
    provinces: [
      {
        name: "Pasco",
        districts: ["Chaupimarca (Cerro de Pasco)", "Huachón", "Huariaca", "Huayllay", "Ninacaca", "Pallanchacra", "Paucartambo", "San Francisco de Asís de Yarusyacán", "Simón Bolívar", "Ticlacayán", "Tinyahuarco", "Vicco", "Yanacancha"],
      },
      {
        name: "Oxapampa",
        districts: ["Oxapampa", "Chontabamba", "Huancabamba", "Palcazú", "Pozuzo", "Puerto Bermúdez", "Villa Rica", "Constitución"],
      },
    ],
  },
  {
    name: "Tumbes",
    provinces: [
      {
        name: "Tumbes",
        districts: ["Tumbes", "Corrales", "La Cruz", "Pampas de Hospital", "San Jacinto", "San Juan de la Virgen"],
      },
      {
        name: "Zarumilla",
        districts: ["Zarumilla", "Aguas Verdes", "Matapalo", "Papayal"],
      },
      {
        name: "Contralmirante Villar",
        districts: ["Zorritos", "Casitas", "Canoas de Punta Sal"],
      },
    ],
  },
  {
    name: "Madre de Dios",
    provinces: [
      {
        name: "Tambopata",
        districts: ["Tambopata (Puerto Maldonado)", "Inambari", "Las Piedras", "Laberinto"],
      },
      {
        name: "Tahuamanu",
        districts: ["Iñapari", "Iberia", "Tahuamanu"],
      },
      {
        name: "Manu",
        districts: ["Manu", "Fitzcarrald", "Madre de Dios", "Huepetuhe"],
      },
    ],
  },
];

export function getPeruDepartments(): string[] {
  return PERU_LOCATIONS.map((d) => d.name);
}

export function getPeruProvinces(departmentName: string): string[] {
  const dept = PERU_LOCATIONS.find(
    (d) => d.name.toLowerCase() === (departmentName ?? "").trim().toLowerCase(),
  );
  if (!dept) return [];
  return dept.provinces.map((p) => p.name);
}

export function getPeruDistricts(departmentName: string, provinceName: string): string[] {
  const dept = PERU_LOCATIONS.find(
    (d) => d.name.toLowerCase() === (departmentName ?? "").trim().toLowerCase(),
  );
  if (!dept) return [];
  const prov = dept.provinces.find(
    (p) => p.name.toLowerCase() === (provinceName ?? "").trim().toLowerCase(),
  );
  if (!prov) return [];
  return prov.districts;
}

export function isLimaMetropolitanaOrCallao(department: string, province?: string): boolean {
  const dep = (department ?? "").trim().toLowerCase();
  const prov = (province ?? "").trim().toLowerCase();
  if (dep === "callao") return true;
  if (dep === "lima" && (!prov || prov === "lima")) return true;
  return false;
}
