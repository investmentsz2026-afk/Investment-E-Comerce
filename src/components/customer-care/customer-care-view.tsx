"use client";

import { useState, useRef, useMemo, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  Headphones,
  PackageSearch,
  Ruler,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import {
  FaArrowRight,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaCircleCheck,
  FaCircleQuestion,
  FaClock,
  FaEnvelope,
  FaHeadset,
  FaLocationDot,
  FaMagnifyingGlass,
  FaReceipt,
  FaRotateLeft,
  FaRulerCombined,
  FaShieldHalved,
  FaTruckFast,
} from "react-icons/fa6";
import { SiWhatsapp } from "react-icons/si";
import { ElasticMesh } from "@/components/ui/elastic-mesh";
import { MagicRings } from "@/components/ui/magic-rings";
import { cn } from "@/lib/utils";

interface CareSlide {
  id: string;
  badge: string;
  promoPill: string;
  eyebrow: string;
  titleLine1: string;
  titleHighlight: string;
  description: string;
  primaryCta: { label: string; href: string; external?: boolean };
  secondaryCta: { label: string; href: string };
  accentTheme: "crimson" | "cobalt" | "emerald";
  orbitalHub: {
    tag: string;
    metricValue: string;
    metricLabel: string;
    title: string;
    subtitle: string;
    highlight: string;
    orbitTags: readonly [string, string, string];
  };
}

const CARE_SLIDES: readonly CareSlide[] = [
  {
    id: "whatsapp-soporte",
    badge: "ATENCIÓN PERSONALIZADA 24/7",
    promoPill: "RESPUESTA EN < 5 MINUTOS",
    eyebrow: "SOPORTE HUMANO Y ASESORÍA COMERCIAL",
    titleLine1: "ATENCIÓN AL CLIENTE",
    titleHighlight: "AMERICAN COLT JEANS™",
    description:
      "Estamos aquí para ayudarte a elegir tu prenda ideal, coordinar envíos express a todo el Perú o asesorarte en compras por mayor B2B.",
    primaryCta: {
      label: "Chat WhatsApp Directo",
      href: "https://wa.me/51926922583?text=Hola%20American%20Colt%20JEANS%E2%84%A2,%20deseo%20asesor%C3%ADa%20sobre%20prendas,%20tallas%20o%20mi%20pedido.",
      external: true,
    },
    secondaryCta: { label: "Seguir mi Pedido", href: "/seguir-pedido" },
    accentTheme: "crimson",
    orbitalHub: {
      tag: "EN LÍNEA AHORA",
      metricValue: "< 5 MIN",
      metricLabel: "TIEMPO DE RESPUESTA",
      title: "Asesoría Directa WhatsApp",
      subtitle: "+51 926 922 583",
      highlight: "Lun – Sáb · 9:00 a 20:00 hrs",
      orbitTags: ["Soporte B2C & B2B", "Cambios 7 Días", "Rastreo en Vivo"],
    },
  },
  {
    id: "envios-nacionales",
    badge: "COBERTURA 100% PERÚ",
    promoPill: "LIMA 24H · PROVINCIAS 48H",
    eyebrow: "DESPACHO RÁPIDO Y EMBALAJE SEGURO",
    titleLine1: "ENVÍOS SEGUROS A",
    titleHighlight: "TODO EL PERÚ",
    description:
      "Entregas en Lima Metropolitana y Callao en 24 a 48 hrs con motorizado express (¡Gratis desde S/ 199!). Envíos a provincias vía Olva Courier y Shalom.",
    primaryCta: { label: "Ver Tarifas y Plazos", href: "#envios" },
    secondaryCta: { label: "Rastrear Pedido", href: "/seguir-pedido" },
    accentTheme: "cobalt",
    orbitalHub: {
      tag: "RED LOGÍSTICA NACIONAL",
      metricValue: "24 - 48H",
      metricLabel: "DESPACHO EXPRESS LIMA",
      title: "Olva Courier & Shalom",
      subtitle: "Tracking y Guía Online",
      highlight: "Envío Gratis Lima > S/ 199",
      orbitTags: ["25 Regiones Perú", "Motorizado Express", "Guía en Vivo"],
    },
  },
  {
    id: "guia-tallas",
    badge: "CALCE ANATÓMICO OFICIAL",
    promoPill: "TALLAS 28 A 46 · S A XXL",
    eyebrow: "TABLA DE MEDIDAS EXACTAS",
    titleLine1: "ENCUENTRA TU TALLA",
    titleHighlight: "CALCE PERFECTO",
    description:
      "Consulta las medidas en centímetros de nuestros Pantalones Drill, Jeans Denim, Camisas y Polos. Si no te queda, te lo cambiamos sin problemas.",
    primaryCta: { label: "Explorar Tallas", href: "#tallas" },
    secondaryCta: { label: "Solicitar Cambio", href: "/cambios-y-devoluciones" },
    accentTheme: "emerald",
    orbitalHub: {
      tag: "PATRONES PERUANOS",
      metricValue: "28 – 46",
      metricLabel: "ESCALA DE TALLAS OFICIAL",
      title: "Drill Stretch & Denim",
      subtitle: "Skinny · Slim · Straight",
      highlight: "Cambio Garantizado 7 Días",
      orbitTags: ["Medidas en cm", "Elastano Premium", "Cambio Sin Costo"],
    },
  },
];

interface QuickCardItem {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof FaHeadset;
  href: string;
  badge: string;
  colorClass: string;
}

const QUICK_CARDS: readonly QuickCardItem[] = [
  {
    id: "whatsapp",
    title: "WhatsApp Inmediato",
    subtitle: "Atención directa con asesores comerciales",
    icon: SiWhatsapp,
    href: "https://wa.me/51926922583?text=Hola,%20necesito%20soporte%20comercial%20en%20American%20Colt.",
    badge: "ONLINE 24/7",
    colorClass: "from-[#25D366] to-[#128C7E]",
  },
  {
    id: "cambios",
    title: "Cambio de Talla o Prenda",
    subtitle: "Sube tus fotos y gestiona tu cambio oficial",
    icon: FaRotateLeft,
    href: "/cambios-y-devoluciones",
    badge: "GARANTÍA 7 DÍAS",
    colorClass: "from-[#EF233C] to-[#DC2626]",
  },
  {
    id: "tallas",
    title: "Guía de Tallas",
    subtitle: "Medidas exactas en cm de la 28 a la 46",
    icon: FaRulerCombined,
    href: "#tallas",
    badge: "DRILL & DENIM",
    colorClass: "from-[#0055FF] to-[#1D4ED8]",
  },
  {
    id: "envios",
    title: "Envíos y Despacho",
    subtitle: "Lima 24h, Provincias Olva y Shalom",
    icon: FaTruckFast,
    href: "#envios",
    badge: "TODO EL PERÚ",
    colorClass: "from-[#7C3AED] to-[#5B21B6]",
  },
];

interface SizeCategory {
  id: string;
  label: string;
  sub: string;
  fitDescription: string;
  imageSrc: string;
  catalogHref: string;
  headers: readonly string[];
  rows: readonly { size: string; col1: string; col2: string; col3: string; col4: string }[];
}

const SIZE_CATEGORIES: readonly SizeCategory[] = [
  {
    id: "pantalones-drill",
    label: "Pantalones Drill Stretch",
    sub: "King 767, Fendy 769, Rolex 770",
    fitDescription:
      "Confeccionados en Drill Stretch de alta recuperación con 3% de elastano. Ofrecen calce ergonómico y máxima libertad de movimiento.",
    imageSrc: "/catalogo-colt/pantalon-king-767-model.png",
    catalogHref: "/catalogo/pantalones?audiencia=hombre",
    headers: ["Talla", "Cintura (cm)", "Cadera (cm)", "Largo Pierna (cm)", "Bota (cm)"],
    rows: [
      { size: "28", col1: "74 - 77", col2: "88 - 92", col3: "100", col4: "15.0" },
      { size: "30", col1: "78 - 82", col2: "93 - 97", col3: "102", col4: "15.5" },
      { size: "32", col1: "83 - 87", col2: "98 - 102", col3: "103", col4: "16.0" },
      { size: "34", col1: "88 - 92", col2: "103 - 107", col3: "104", col4: "16.5" },
      { size: "36", col1: "93 - 97", col2: "108 - 112", col3: "105", col4: "17.0" },
      { size: "38", col1: "98 - 102", col2: "113 - 117", col3: "106", col4: "17.5" },
      { size: "40", col1: "103 - 107", col2: "118 - 122", col3: "107", col4: "18.0" },
      { size: "42", col1: "108 - 112", col2: "123 - 127", col3: "107", col4: "18.5" },
      { size: "44", col1: "113 - 117", col2: "128 - 132", col3: "108", col4: "19.0" },
      { size: "46", col1: "118 - 122", col2: "133 - 137", col3: "108", col4: "19.5" },
    ],
  },
  {
    id: "jeans-denim",
    label: "Jeans Denim",
    sub: "Relaxed 750, Comfort 762, Parker 769",
    fitDescription:
      "Mezclilla pesada de alto gramaje con costuras reforzadas de hilo doble. Calce clásico y holgado para máxima resistencia y estilo atemporal.",
    imageSrc: "/catalogo-colt/jean-comfort-762-model.png",
    catalogHref: "/catalogo/denim?audiencia=hombre",
    headers: ["Talla", "Cintura (cm)", "Tiro Frontal (cm)", "Largo Total (cm)", "Ancho Bota (cm)"],
    rows: [
      { size: "28", col1: "74 - 77", col2: "26.5", col3: "101", col4: "18.0" },
      { size: "30", col1: "78 - 82", col2: "27.5", col3: "102", col4: "18.5" },
      { size: "32", col1: "83 - 87", col2: "28.5", col3: "103", col4: "19.0" },
      { size: "34", col1: "88 - 92", col2: "29.5", col3: "104", col4: "19.5" },
      { size: "36", col1: "93 - 97", col2: "30.5", col3: "105", col4: "20.0" },
      { size: "38", col1: "98 - 102", col2: "31.5", col3: "106", col4: "20.5" },
      { size: "40", col1: "103 - 107", col2: "32.5", col3: "107", col4: "21.0" },
      { size: "42", col1: "108 - 112", col2: "33.5", col3: "107", col4: "21.5" },
      { size: "44", col1: "113 - 117", col2: "34.5", col3: "108", col4: "22.0" },
      { size: "46", col1: "118 - 122", col2: "35.5", col3: "108", col4: "22.5" },
    ],
  },
  {
    id: "camisas-hombre",
    label: "Camisas Denim & Algodón",
    sub: "Camisa Zair & Kendall Slim Fit",
    fitDescription:
      "100% Algodón Peruano transpirable y resistente. Entalle Slim Fit estilizado en hombros y pecho con caída natural.",
    imageSrc: "/catalogo-colt/camisa-zair-model.png",
    catalogHref: "/catalogo/camisas?audiencia=hombre",
    headers: ["Talla", "Pecho (cm)", "Espalda (cm)", "Largo Total (cm)", "Cuello (cm)"],
    rows: [
      { size: "S", col1: "96 - 100", col2: "43.5", col3: "73", col4: "38 - 39" },
      { size: "M", col1: "101 - 105", col2: "45.0", col3: "75", col4: "40 - 41" },
      { size: "L", col1: "106 - 110", col2: "46.5", col3: "77", col4: "42 - 43" },
      { size: "XL", col1: "111 - 116", col2: "48.0", col3: "79", col4: "44 - 45" },
    ],
  },
  {
    id: "polos-pique",
    label: "Polos Piqué",
    sub: "Polo Mark 100% Algodón Peruano",
    fitDescription:
      "Tejido piqué clásico de tacto suave con cuello camisero que no se deforma. Disponible en 10 colores oficiales.",
    imageSrc: "/catalogo-colt/polo-mark-model.png",
    catalogHref: "/catalogo/polos?audiencia=hombre",
    headers: ["Talla", "Pecho (cm)", "Hombros (cm)", "Largo Total (cm)", "Manga (cm)"],
    rows: [
      { size: "S", col1: "94 - 98", col2: "42", col3: "68", col4: "20.5" },
      { size: "M", col1: "99 - 103", col2: "44", col3: "70", col4: "21.5" },
      { size: "L", col1: "104 - 108", col2: "46", col3: "72", col4: "22.5" },
      { size: "XL", col1: "109 - 114", col2: "48", col3: "74", col4: "23.5" },
      { size: "XXL", col1: "115 - 120", col2: "50", col3: "76", col4: "24.5" },
    ],
  },
  {
    id: "bermudas-drill",
    label: "Bermudas Drill",
    sub: "Balance 770 Straight Fit",
    fitDescription:
      "Corte recto y fresco por encima de la rodilla confeccionado con drill stretch ligero, ideal para clima cálido y urbano.",
    imageSrc: "/catalogo-colt/bermuda-balance-770-model.png",
    catalogHref: "/catalogo/pantalones?audiencia=hombre",
    headers: ["Talla", "Cintura (cm)", "Cadera (cm)", "Largo Total (cm)", "Basta (cm)"],
    rows: [
      { size: "28", col1: "74 - 77", col2: "90 - 94", col3: "48", col4: "24.0" },
      { size: "30", col1: "78 - 82", col2: "95 - 99", col3: "49", col4: "25.0" },
      { size: "32", col1: "83 - 87", col2: "100 - 104", col3: "50", col4: "26.0" },
      { size: "34", col1: "88 - 92", col2: "105 - 109", col3: "51", col4: "27.0" },
      { size: "36", col1: "93 - 97", col2: "110 - 114", col3: "52", col4: "28.0" },
      { size: "38", col1: "98 - 102", col2: "115 - 119", col3: "53", col4: "29.0" },
      { size: "40", col1: "103 - 107", col2: "120 - 124", col3: "54", col4: "30.0" },
    ],
  },
];

interface FaqItem {
  id: string;
  category: "pagos" | "envios" | "tallas" | "mayorista";
  q: string;
  a: string;
}

const FAQS: readonly FaqItem[] = [
  {
    id: "f1",
    category: "pagos",
    q: "¿Cuáles son los métodos de pago aceptados?",
    a: "Aceptamos pagos 100% seguros mediante Tarjetas de Crédito y Débito (Visa, Mastercard, American Express, Diners Club) a través de Mercado Pago, billeteras digitales instantáneas (Yape Oficial y Plin Oficial), transferencias directas BCP, BBVA, Interbank y Scotiabank, y Apple/Google Pay. Para clientes corporativos B2B aceptamos transferencias CCI con Factura electrónica.",
  },
  {
    id: "f2",
    category: "pagos",
    q: "¿Emiten Boleta y Factura electrónica con RUC 20?",
    a: "Sí, emitimos comprobantes de pago autorizados por SUNAT de manera inmediata. Durante el proceso de compra puedes elegir Boleta de Venta (con DNI o Carné de Extranjería) o Factura Electrónica indicando tu número de RUC de 11 dígitos, Razón Social y domicilio fiscal.",
  },
  {
    id: "f3",
    category: "envios",
    q: "¿Cuánto tiempo demora en llegar mi pedido en Lima y provincias?",
    a: "Para Lima Metropolitana y Callao, el tiempo de entrega es de 24 a 48 horas hábiles con motorizado express (y envío totalmente gratuito en compras mayores a S/ 199.00). Para provincias a nivel nacional, los pedidos se despachan a través de agencias líderes como Olva Courier y Shalom Empresarial con entrega en 48 a 72 horas hábiles con número de seguimiento para rastreo en vivo.",
  },
  {
    id: "f4",
    category: "envios",
    q: "¿Cómo realizo el seguimiento de mi compra?",
    a: "Apenas realizas tu compra puedes ingresar a 'Seguir Pedido' en el menú superior con tu número de orden (ORD-2026-...) o código de guía para ver las actualizaciones en tiempo real. También puedes consultar todo tu historial iniciando sesión en 'Mis Pedidos'.",
  },
  {
    id: "f5",
    category: "tallas",
    q: "¿Qué sucede si una prenda no me queda o me equivoqué de talla?",
    a: "En American Colt JEANS™ cuentas con garantía de cambio de talla fácil y sin complicaciones dentro de los 7 días calendario posteriores a la entrega. Solo asegúrate de conservar la prenda sin uso, con sus etiquetas y boleta o factura de compra. Escríbenos a nuestro WhatsApp y coordinaremos el recojo o cambio inmediato.",
  },
  {
    id: "f6",
    category: "mayorista",
    q: "¿Cómo funcionan las compras por mayor y precios de fábrica B2B?",
    a: "Nuestras tarifas mayoristas se activan automáticamente por tramos desde 12 unidades (Tarifa Bronce), 50 unidades (Tarifa Plata) y 200+ unidades (Tarifa Oro). Puedes combinar diferentes tallas y colores de un mismo modelo. Si tienes una tienda, boutique o distribuidora, también puedes registrar tu empresa en nuestro portal Mayorista B2B para acceder a cotizaciones formalizadas y atención comercial exclusiva.",
  },
  {
    id: "f7",
    category: "tallas",
    q: "¿Las prendas de American Colt JEANS™ encogen o destiñen al lavar?",
    a: "No. Todas nuestras prendas pasan por un proceso de prelavado industrial y fijación de color reactivo. Recomendamos lavar con agua fría del revés y secar a la sombra para mantener el elastano y el tono del tejido como el primer día.",
  },
  {
    id: "f8",
    category: "mayorista",
    q: "¿Tienen catálogo digital en PDF para enviar a mis clientes o socios?",
    a: "Sí. Contamos con el Catálogo Oficial 2026 en PDF con todas las fotos de modelos, fichas técnicas y detalles de confección. Puedes solicitarlo directamente por nuestro WhatsApp comercial o descargarlo desde la sección Mayorista de la tienda.",
  },
];

/** Tarjeta 3D Magnética interactiva con perspectiva */
function TiltQuickCard({ item }: { item: QuickCardItem }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });

  const handleMouseMove = (e: MouseEvent<HTMLAnchorElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 18;
    const rotateX = (0.5 - py) * 18;
    setTilt({ rotateX, rotateY, glareX: px * 100, glareY: py * 100 });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  };

  return (
    <a
      ref={cardRef}
      href={item.href}
      target={item.href.startsWith("http") ? "_blank" : undefined}
      rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(850px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        transformStyle: "preserve-3d",
      }}
      className="group/card relative flex flex-col justify-between overflow-hidden rounded-xl border-2 border-white/60 bg-white p-3 shadow-md transition-all duration-300 hover:border-[#0055FF] hover:shadow-xl sm:rounded-2xl sm:p-4"
    >
      {/* Brillo dinámico 3D */}
      <div
        aria-hidden
        style={{
          background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(0,85,255,0.12) 0%, transparent 60%)`,
        }}
        className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
      />

      <div>
        <div className="flex items-center justify-between gap-1">
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-md transition-transform duration-300 group-hover/card:scale-110 sm:size-11 sm:rounded-xl",
              item.colorClass,
            )}
          >
            <item.icon className="size-4 sm:size-5" aria-hidden />
          </span>
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 font-mono text-[0.48rem] font-black uppercase tracking-wider text-slate-700 sm:px-2.5 sm:text-[0.58rem]">
            {item.badge}
          </span>
        </div>

        <h3 className="mt-2 font-sans text-xs font-black uppercase leading-tight text-slate-900 group-hover/card:text-[#0055FF] sm:mt-3 sm:text-base">
          {item.title}
        </h3>
        <p className="mt-0.5 line-clamp-2 text-[0.65rem] leading-snug text-slate-600 sm:mt-1 sm:line-clamp-none sm:text-xs sm:leading-relaxed">
          {item.subtitle}
        </p>
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 sm:mt-4 sm:pt-3">
        <span className="font-mono text-[0.58rem] font-bold uppercase text-[#0055FF] group-hover/card:underline sm:text-[0.68rem]">
          Acceder
        </span>
        <span className="flex size-5 items-center justify-center rounded-full bg-blue-50 text-[#0055FF] transition-all group-hover/card:scale-110 group-hover/card:bg-[#0055FF] group-hover/card:text-white sm:size-6">
          <FaArrowRight className="size-2 sm:size-2.5" aria-hidden />
        </span>
      </div>
    </a>
  );
}

export function CustomerCareView() {
  const [slideIdx, setSlideIdx] = useState(0);
  const [activeSizeCategory, setActiveSizeCategory] = useState(0);
  const [faqFilter, setFaqFilter] = useState<"todas" | "pagos" | "envios" | "tallas" | "mayorista">("todas");
  const [faqSearch, setFaqSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<string | null>("f1");

  const slide = CARE_SLIDES[slideIdx];
  const sizeCat = SIZE_CATEGORIES[activeSizeCategory];

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((f) => {
      if (faqFilter !== "todas" && f.category !== faqFilter) return false;
      if (!faqSearch.trim()) return true;
      const q = faqSearch.toLowerCase();
      return f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
    });
  }, [faqFilter, faqSearch]);

  const nextSlide = () => setSlideIdx((prev) => (prev + 1) % CARE_SLIDES.length);
  const prevSlide = () => setSlideIdx((prev) => (prev - 1 + CARE_SLIDES.length) % CARE_SLIDES.length);

  return (
    <div className="bg-white pt-[6.75rem] sm:pt-[7rem] lg:pt-[10.25rem]">
      {/* 1. HERO CINÉTICO CON ANILLOS MÁGICOS WEBGL2 Y TÍTULO ELÁSTICO 3D (SIN IMAGEN DE FONDO) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#040711] via-[#0A132B] to-[#0F172A] text-white">
        {/* ANILLOS MÁGICOS INTERACTIVOS DE FONDO EN COLORES DE LA MARCA (ROJO CARMESÍ + AZUL COBALTO) */}
        <div aria-hidden className="absolute inset-0 z-0">
          <MagicRings
            color="#EF233C"
            colorTwo="#2563EB"
            motion="pulse"
            ringCount={6}
            speed={1}
            lineThickness={2}
            glow={1}
            hoverScale={1.2}
            clickBurst
            baseRadius={0.35}
            radiusStep={0.1}
            expansion={0.1}
            taper={1.5}
            rotation={0}
            spin={0}
            tilt={0}
            dispersion={0}
            grain={0}
            opacity={1}
            followMouse={false}
            mouseInfluence={0.2}
            hoverIntensity={1}
            parallax={0.05}
            intro
            theme="dark"
          />
        </div>

        {/* Halos de luz ambiental muy suaves para integrar el lienzo */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 z-0 size-96 rounded-full bg-[#2563EB]/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 right-0 z-0 size-[420px] rounded-full bg-[#EF233C]/15 blur-3xl"
        />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex min-h-[290px] w-full items-center py-5 sm:min-h-[450px] sm:py-10 lg:min-h-[500px] lg:py-12"
          >
            <div className="shell grid w-full items-center gap-4 px-7 sm:gap-8 sm:px-6 lg:grid-cols-12">
              {/* COLUMNA IZQUIERDA: TIPOGRAFÍA GRÁFICA MODERNA Y LIMPIA */}
              <div className="space-y-2.5 sm:space-y-4 lg:col-span-7">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="bg-flow inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-2.5 py-0.5 font-mono text-[0.52rem] font-black uppercase tracking-wider text-white shadow-md shadow-red-600/25 sm:gap-1.5 sm:px-3.5 sm:py-1 sm:text-[0.65rem] sm:tracking-widest">
                    <FaHeadset className="size-2.5 text-white sm:size-3" aria-hidden />
                    <span>{slide.badge}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/35 bg-sky-500/15 px-2.5 py-0.5 font-mono text-[0.52rem] font-extrabold uppercase tracking-wider text-sky-200 backdrop-blur-md sm:gap-1.5 sm:px-3.5 sm:py-1 sm:text-[0.65rem] sm:tracking-widest">
                    <FaCircleCheck className="size-2.5 text-emerald-400 sm:size-3" aria-hidden />
                    <span>{slide.promoPill}</span>
                  </span>
                </div>

                <p className="flex items-center gap-1.5 font-mono text-[0.56rem] font-extrabold uppercase tracking-[0.14em] text-amber-300 sm:gap-2 sm:text-[0.7rem] sm:tracking-[0.2em]">
                  <Sparkles className="size-3 sm:size-3.5" aria-hidden />
                  <span>{slide.eyebrow}</span>
                </p>

                <div className="relative h-[74px] w-full max-w-[660px] sm:h-[132px] lg:h-[154px]">
                  <h1 className="sr-only">
                    {slide.titleLine1} {slide.titleHighlight}
                  </h1>
                  <ElasticMesh
                    text={`${slide.titleLine1}\n${slide.titleHighlight}`}
                    material="balloon"
                    color="#ef233c"
                    lineColors={["#ffffff", "#ff4b5c"]}
                    align="left"
                    fontWeight={900}
                    inflate={1}
                    stiffness={0.5}
                    wobble={0.6}
                    grabRadius={70}
                    stretch={0.5}
                    press={0.5}
                    shadow={0.5}
                    intro
                    theme="dark"
                    className="cursor-grab active:cursor-grabbing"
                  />
                </div>

                <p className="max-w-xl text-xs font-medium leading-snug text-slate-300 sm:text-base sm:leading-relaxed">
                  {slide.description}
                </p>

                {/* Botones Principales */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5 sm:gap-3 sm:pt-1">
                  {slide.primaryCta.external ? (
                    <a
                      href={slide.primaryCta.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E] px-4 font-sans text-[0.64rem] font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-600/25 transition-all hover:scale-105 hover:shadow-xl sm:h-11 sm:gap-2.5 sm:px-6 sm:text-sm"
                    >
                      <SiWhatsapp className="size-3.5 sm:size-4" aria-hidden />
                      <span>{slide.primaryCta.label}</span>
                    </a>
                  ) : (
                    <a
                      href={slide.primaryCta.href}
                      className="bg-flow inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF233C] px-4 font-sans text-[0.64rem] font-black uppercase tracking-wider text-white shadow-lg shadow-red-600/25 transition-all hover:scale-105 sm:h-11 sm:gap-2 sm:px-6 sm:text-sm"
                    >
                      <span>{slide.primaryCta.label}</span>
                      <FaArrowRight className="size-3 sm:size-3.5" aria-hidden />
                    </a>
                  )}

                  <Link
                    href={slide.secondaryCta.href}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 text-[0.64rem] font-extrabold uppercase tracking-wider text-white backdrop-blur-md transition-all hover:scale-105 hover:border-white/60 hover:bg-white hover:text-slate-950 sm:h-11 sm:gap-2 sm:px-6 sm:text-sm"
                  >
                    <PackageSearch className="size-3.5 sm:size-4" aria-hidden />
                    <span>{slide.secondaryCta.label}</span>
                  </Link>
                </div>

                {/* Franja gráfica de confianza */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1.5 text-[0.62rem] font-semibold text-slate-300 sm:gap-x-6 sm:gap-y-2 sm:pt-3 sm:text-xs">
                  <span className="inline-flex items-center gap-1 sm:gap-2">
                    <ShieldCheck className="size-3 text-emerald-400 sm:size-4" aria-hidden />
                    <span>Garantía 7 Días</span>
                  </span>
                  <span className="inline-flex items-center gap-1 sm:gap-2">
                    <FaClock className="size-3 text-amber-300 sm:size-3.5" aria-hidden />
                    <span>Lun – Sáb · 9 a 20h</span>
                  </span>
                  <span className="inline-flex items-center gap-1 sm:gap-2">
                    <FaLocationDot className="size-3 text-sky-400 sm:size-3.5" aria-hidden />
                    <span>25 Regiones Perú</span>
                  </span>
                </div>
              </div>

              {/* COLUMNA DERECHA: RESUMEN COMPACTO EN MÓVIL + ANILLOS ORBITALES EN TABLET/DESKTOP */}
              <div className="relative flex items-center justify-center lg:col-span-5">
                {/* Tarjeta resumen horizontal compacta en < sm */}
                <div className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/20 bg-slate-900/75 px-3.5 py-2.5 shadow-lg backdrop-blur-md sm:hidden">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#EF233C] text-white">
                      {slide.id === "whatsapp-soporte" ? (
                        <Headphones className="size-4" aria-hidden />
                      ) : slide.id === "envios-nacionales" ? (
                        <Truck className="size-4" aria-hidden />
                      ) : (
                        <Ruler className="size-4" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-sans text-xs font-black uppercase text-white">
                        {slide.orbitalHub.title}
                      </p>
                      <p className="truncate font-mono text-[0.62rem] font-bold text-amber-300">
                        {slide.orbitalHub.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-sans text-base font-black text-white leading-none">
                      {slide.orbitalHub.metricValue}
                    </p>
                    <p className="mt-0.5 font-mono text-[0.5rem] font-bold uppercase text-sky-300">
                      {slide.orbitalHub.metricLabel}
                    </p>
                  </div>
                </div>

                <div className="relative hidden size-[330px] items-center justify-center sm:flex">
                  {/* Onda de pulso radar central */}
                  <motion.div
                    aria-hidden
                    animate={{ scale: [0.88, 1.15, 0.88], opacity: [0.4, 0.08, 0.4] }}
                    transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
                    className="pointer-events-none absolute inset-0 rounded-full border-2 border-sky-400/35"
                  />

                  {/* Anillo satélite con cápsulas flotantes */}
                  <motion.div
                    aria-hidden
                    animate={{ rotate: 360 }}
                    transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
                    className="pointer-events-none absolute inset-3 rounded-full border border-white/15"
                  >
                    <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full bg-amber-300 shadow-[0_0_12px_#FCD34D]" />
                  </motion.div>

                  {/* Tarjeta Central Glassmorphic con Gráficos */}
                  <motion.div
                    initial={{ scale: 0.94, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.45 }}
                    className="relative z-10 w-64 rounded-3xl border border-white/20 bg-slate-900/75 p-5 text-center shadow-[0_24px_65px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:w-72 sm:p-6"
                  >
                    <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] via-[#1E3A8A] to-[#EF233C] text-white shadow-lg shadow-blue-600/30">
                      {slide.id === "whatsapp-soporte" ? (
                        <Headphones className="size-7" aria-hidden />
                      ) : slide.id === "envios-nacionales" ? (
                        <Truck className="size-7" aria-hidden />
                      ) : (
                        <Ruler className="size-7" aria-hidden />
                      )}
                    </div>

                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-0.5 font-mono text-[0.58rem] font-extrabold uppercase tracking-widest text-emerald-300">
                      <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                      {slide.orbitalHub.tag}
                    </span>

                    <div className="mt-3">
                      <p className="bg-gradient-to-r from-white via-sky-100 to-amber-200 bg-clip-text font-sans text-3xl font-black tracking-tight text-transparent sm:text-4xl">
                        {slide.orbitalHub.metricValue}
                      </p>
                      <p className="mt-0.5 font-mono text-[0.6rem] font-bold uppercase tracking-[0.18em] text-sky-300">
                        {slide.orbitalHub.metricLabel}
                      </p>
                    </div>

                    <div className="mt-4 border-t border-white/10 pt-3">
                      <p className="font-sans text-sm font-black uppercase text-white">
                        {slide.orbitalHub.title}
                      </p>
                      <p className="mt-0.5 font-mono text-xs font-bold text-amber-300">
                        {slide.orbitalHub.subtitle}
                      </p>
                      <p className="mt-0.5 text-[0.68rem] text-slate-400">
                        {slide.orbitalHub.highlight}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                      {slide.orbitalHub.orbitTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 font-mono text-[0.56rem] font-bold text-slate-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Flechas de navegación del carrusel */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Diapositiva anterior"
          className="absolute left-1.5 top-1/2 z-20 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-slate-900/70 text-white shadow-md backdrop-blur-md transition-transform hover:scale-110 hover:border-white hover:bg-[#2563EB] sm:left-3 sm:size-10"
        >
          <FaChevronLeft className="size-2.5 sm:size-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Siguiente diapositiva"
          className="absolute right-1.5 top-1/2 z-20 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-slate-900/70 text-white shadow-md backdrop-blur-md transition-transform hover:scale-110 hover:border-white hover:bg-[#2563EB] sm:right-3 sm:size-10"
        >
          <FaChevronRight className="size-2.5 sm:size-3.5" aria-hidden />
        </button>

        {/* Pestañas inferiores del carrusel */}
        <div className="relative z-10 border-t border-white/10 bg-slate-950/75 backdrop-blur-md">
          <div className="shell grid grid-cols-3 gap-1 py-1.5 sm:gap-2 sm:py-2.5">
            {CARE_SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSlideIdx(idx)}
                className={cn(
                  "truncate rounded-lg px-1.5 py-1.5 text-center font-sans text-[0.55rem] font-black uppercase tracking-wide transition-all sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs sm:tracking-wider",
                  idx === slideIdx
                    ? "bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#EF233C] text-white shadow-md"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                )}
              >
                {s.titleHighlight}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. CUADRÍCULA DE 4 TARJETAS 3D MAGNÉTICAS (2 COLUMNAS EN MÓVIL) */}
      <section className="border-b border-blue-100 bg-gradient-to-b from-blue-50/50 to-white py-6 sm:py-10 lg:py-12">
        <div className="shell">
          <div className="mb-4 flex flex-col items-center text-center sm:mb-6">
            <span className="rounded-full bg-[#0055FF]/10 px-2.5 py-0.5 font-mono text-[0.55rem] font-black uppercase tracking-widest text-[#0055FF] sm:px-3 sm:py-1 sm:text-[0.62rem]">
              SERVICIOS Y CANALES DIRECTOS
            </span>
            <h2 className="mt-1 font-sans text-lg font-black uppercase tracking-tight text-slate-900 sm:text-2xl">
              ¿En qué podemos ayudarte hoy?
            </h2>
            <p className="mt-0.5 max-w-xl text-[0.7rem] text-slate-600 sm:mt-1 sm:text-sm">
              Accede al instante a la información oficial y asesoría en vivo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
            {QUICK_CARDS.map((card) => (
              <TiltQuickCard key={card.id} item={card} />
            ))}
          </div>

          {/* Banner Destacado: Gestión Oficial de Cambio de Talla con Subida de Fotos */}
          <div className="mt-4 overflow-hidden rounded-2xl border-2 border-red-200 bg-gradient-to-r from-[#1E3A8A] via-[#DC2626] to-[#041C4A] p-3.5 text-white shadow-xl sm:mt-6 sm:rounded-3xl sm:p-6">
            <div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center lg:gap-4">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 font-mono text-[0.52rem] font-black uppercase tracking-wider text-[#DC2626] shadow-xs sm:gap-1.5 sm:px-3 sm:text-[0.58rem]">
                  <FaRotateLeft className="size-2.5" aria-hidden />
                  <span>GARANTÍA DE CAMBIO DE TALLA</span>
                </span>
                <h3 className="mt-1.5 font-sans text-sm font-black uppercase text-white sm:mt-2 sm:text-xl">
                  ¿Pediste una prenda y la talla te quedó grande o chica?
                </h3>
                <p className="mt-0.5 text-[0.68rem] leading-snug text-white/90 sm:mt-1 sm:text-sm sm:leading-relaxed">
                  Solicita tu cambio en línea con tu número de pedido, sube fotos y coordina de inmediato por WhatsApp.
                </p>
              </div>

              <Link
                href="/cambios-y-devoluciones"
                className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white px-4 font-sans text-[0.64rem] font-black uppercase tracking-wider text-[#DC2626] shadow-lg transition-transform hover:scale-105 hover:bg-slate-100 sm:h-11 sm:gap-2 sm:rounded-2xl sm:px-6 sm:text-xs"
              >
                <span>Solicitar Cambio Ahora</span>
                <FaArrowRight className="size-2.5 sm:size-3" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECCIÓN INTERACTIVA DE GUÍA DE TALLAS ANATÓMICAS */}
      <section id="tallas" className="border-b border-blue-100 bg-white py-7 sm:py-12 lg:py-16">
        <div className="shell space-y-4 sm:space-y-8">
          <div className="flex flex-col items-start justify-between gap-2.5 border-b border-slate-200 pb-3.5 sm:gap-4 sm:pb-5 md:flex-row md:items-end">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EF233C] px-2.5 py-0.5 font-mono text-[0.54rem] font-black uppercase tracking-wider text-white sm:gap-1.5 sm:px-3 sm:text-[0.6rem]">
                <FaRulerCombined className="size-2.5" aria-hidden />
                <span>TABLA ANATÓMICA OFICIAL 2026</span>
              </span>
              <h2 className="mt-1.5 font-sans text-xl font-black uppercase tracking-tight text-slate-900 sm:mt-2 sm:text-3xl">
                Guía de Tallas &amp; Calce Perfecto
              </h2>
              <p className="mt-0.5 max-w-2xl text-[0.7rem] text-slate-600 sm:mt-1 sm:text-sm">
                Patrones exactos confeccionados en el Perú para asegurar tu entalle ideal.
              </p>
            </div>

            <Link
              href={sizeCat.catalogHref}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0055FF] to-[#1D4ED8] px-3.5 py-1.5 font-mono text-[0.62rem] font-black uppercase tracking-wider text-white shadow-md transition-transform hover:scale-105 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-xs"
            >
              <span>Ver en Catálogo</span>
              <FaArrowRight className="size-2.5 sm:size-3" aria-hidden />
            </Link>
          </div>

          {/* Selector de categoría de prenda */}
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1 sm:gap-2">
            {SIZE_CATEGORIES.map((cat, idx) => {
              const active = idx === activeSizeCategory;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveSizeCategory(idx)}
                  className={cn(
                    "flex shrink-0 flex-col items-start rounded-xl border px-3 py-1.5 text-left transition-all sm:rounded-2xl sm:px-4 sm:py-2.5",
                    active
                      ? "border-[#0055FF] bg-gradient-to-r from-[#0055FF] to-[#1D4ED8] text-white shadow-md"
                      : "border-slate-200 bg-slate-50 text-slate-800 hover:border-[#0055FF]/40 hover:bg-blue-50",
                  )}
                >
                  <span className="font-sans text-[0.68rem] font-black uppercase tracking-wide sm:text-xs">
                    {cat.label}
                  </span>
                  <span className={cn("text-[0.56rem] sm:text-[0.65rem]", active ? "text-blue-100" : "text-slate-500")}>
                    {cat.sub}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tabla de Medidas con Imagen del Modelo */}
          <div className="grid gap-4 lg:grid-cols-12 lg:items-start lg:gap-6">
            {/* Tabla de Tallas */}
            <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-md lg:col-span-8">
              <div className="border-b border-slate-200 bg-slate-50 p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-sans text-xs font-black uppercase text-slate-900 sm:text-base">
                    Medidas: {sizeCat.label}
                  </h3>
                  <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 font-mono text-[0.54rem] font-bold text-[#0055FF] sm:px-3 sm:text-[0.62rem]">
                    En cm
                  </span>
                </div>
                <p className="mt-1 text-[0.68rem] text-slate-600 sm:text-xs">{sizeCat.fitDescription}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[0.68rem] sm:text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-blue-50/60 font-mono text-[0.58rem] font-black uppercase tracking-wider text-slate-700 sm:text-[0.65rem]">
                      {sizeCat.headers.map((h) => (
                        <th key={h} className="whitespace-nowrap px-2.5 py-2 sm:px-4 sm:py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sizeCat.rows.map((r, i) => (
                      <tr key={r.size} className={cn("hover:bg-blue-50/40", i % 2 === 0 ? "bg-white" : "bg-slate-50/40")}>
                        <td className="whitespace-nowrap px-2.5 py-2 font-mono font-black text-[#0055FF] sm:px-4 sm:py-3">
                          {r.size}
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2 font-semibold text-slate-700 sm:px-4 sm:py-3">{r.col1}</td>
                        <td className="whitespace-nowrap px-2.5 py-2 font-semibold text-slate-700 sm:px-4 sm:py-3">{r.col2}</td>
                        <td className="whitespace-nowrap px-2.5 py-2 font-semibold text-slate-700 sm:px-4 sm:py-3">{r.col3}</td>
                        <td className="whitespace-nowrap px-2.5 py-2 font-semibold text-slate-700 sm:px-4 sm:py-3">{r.col4}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tarjeta Visual y Consejos de Medición (2 columnas en móvil) */}
            <div className="grid grid-cols-2 gap-2.5 lg:col-span-4 lg:grid-cols-1 lg:gap-4">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-sm sm:rounded-2xl sm:border-2 sm:p-3.5">
                <div className="relative aspect-[3/3.4] w-full overflow-hidden rounded-lg bg-slate-200 sm:aspect-[3/3.6] sm:rounded-xl">
                  <Image
                    src={sizeCat.imageSrc}
                    alt={sizeCat.label}
                    fill
                    sizes="(max-width: 640px) 46vw, 320px"
                    className="object-cover"
                  />
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-slate-950/80 px-2 py-0.5 font-mono text-[0.5rem] font-bold text-white backdrop-blur-xs sm:bottom-2 sm:left-2 sm:px-2.5 sm:text-[0.55rem]">
                    American Colt
                  </span>
                </div>
              </div>

              {/* Guía rápida: ¿Cómo medirte? */}
              <div className="flex flex-col justify-center rounded-xl border border-blue-200 bg-blue-50/70 p-2.5 sm:rounded-2xl sm:p-4">
                <h4 className="flex items-center gap-1 font-sans text-[0.65rem] font-black uppercase text-[#0055FF] sm:gap-1.5 sm:text-xs">
                  <FaRulerCombined className="size-3 shrink-0 sm:size-3.5" aria-hidden />
                  <span>¿Cómo medirte?</span>
                </h4>
                <ul className="mt-1.5 space-y-1 text-[0.62rem] leading-tight text-slate-700 sm:mt-2.5 sm:space-y-1.5 sm:text-xs sm:leading-snug">
                  <li>
                    <strong className="text-slate-900">1. Cintura:</strong> Donde asienta tu pantalón.
                  </li>
                  <li>
                    <strong className="text-slate-900">2. Cadera:</strong> Parte más ancha de glúteos.
                  </li>
                  <li>
                    <strong className="text-slate-900">3. Largo:</strong> Entrepierna hasta tobillo.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECCIÓN DE ENVÍOS Y COBERTURA NACIONAL */}
      <section id="envios" className="border-b border-blue-100 bg-slate-50 py-7 sm:py-12 lg:py-16">
        <div className="shell space-y-4 sm:space-y-8">
          <div className="flex flex-col items-center text-center">
            <span className="rounded-full bg-[#0055FF] px-3 py-0.5 font-mono text-[0.55rem] font-black uppercase tracking-widest text-white shadow-xs sm:px-3.5 sm:py-1 sm:text-[0.62rem]">
              LOGÍSTICA Y DESPACHO EXCLUSIVO
            </span>
            <h2 className="mt-1.5 font-sans text-xl font-black uppercase tracking-tight text-slate-900 sm:mt-2 sm:text-3xl">
              Envíos y Cobertura Nacional
            </h2>
            <p className="mt-0.5 max-w-2xl text-[0.7rem] text-slate-600 sm:mt-1 sm:text-sm">
              Llegamos a cada rincón del Perú con embalaje sellado de fábrica.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-6 md:grid-cols-3">
            {/* Tarjeta Lima */}
            <div className="rounded-2xl border border-blue-100 bg-white p-3 shadow-md transition-all hover:-translate-y-1 hover:border-[#0055FF] sm:rounded-3xl sm:border-2 sm:p-6">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0055FF] to-[#1D4ED8] text-white shadow-md sm:size-12 sm:rounded-2xl">
                <FaTruckFast className="size-4 sm:size-6" aria-hidden />
              </span>
              <h3 className="mt-2.5 font-sans text-xs font-black uppercase leading-tight text-slate-900 sm:mt-4 sm:text-lg">
                Lima &amp; Callao
              </h3>
              <p className="mt-1 line-clamp-2 text-[0.62rem] leading-snug text-slate-600 sm:line-clamp-none sm:text-xs sm:leading-relaxed">
                Entrega 24–48h hábiles con motorizado express.
              </p>
              <div className="mt-2.5 space-y-1 border-t border-slate-100 pt-2 text-[0.6rem] sm:mt-4 sm:space-y-2 sm:pt-3 sm:text-xs">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-slate-500">Tarifa:</span>
                  <span className="font-mono font-bold text-slate-900">S/ 12.00</span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-slate-500">Gratis:</span>
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 font-mono text-[0.54rem] font-black text-emerald-800 sm:px-2 sm:text-xs">
                    &gt; S/ 199
                  </span>
                </div>
                <div className="hidden items-center justify-between sm:flex">
                  <span className="text-slate-500">Horario:</span>
                  <span className="font-semibold text-slate-700">9:00 a 19:00 hrs</span>
                </div>
              </div>
            </div>

            {/* Tarjeta Provincias */}
            <div className="rounded-2xl border border-blue-100 bg-white p-3 shadow-md transition-all hover:-translate-y-1 hover:border-[#EF233C] sm:rounded-3xl sm:border-2 sm:p-6">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#EF233C] to-[#DC2626] text-white shadow-md sm:size-12 sm:rounded-2xl">
                <FaLocationDot className="size-4 sm:size-6" aria-hidden />
              </span>
              <h3 className="mt-2.5 font-sans text-xs font-black uppercase leading-tight text-slate-900 sm:mt-4 sm:text-lg">
                Provincias Perú
              </h3>
              <p className="mt-1 line-clamp-2 text-[0.62rem] leading-snug text-slate-600 sm:line-clamp-none sm:text-xs sm:leading-relaxed">
                Despacho a 25 regiones vía Olva Courier y Shalom.
              </p>
              <div className="mt-2.5 space-y-1 border-t border-slate-100 pt-2 text-[0.6rem] sm:mt-4 sm:space-y-2 sm:pt-3 sm:text-xs">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-slate-500">Plazo:</span>
                  <span className="font-mono font-bold text-[#EF233C]">48–72 hrs</span>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-slate-500">Entrega:</span>
                  <span className="font-semibold text-slate-700">Agencia / Dom.</span>
                </div>
                <div className="hidden items-center justify-between sm:flex">
                  <span className="text-slate-500">Seguimiento:</span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 font-mono font-bold text-[#0055FF]">
                    Código Online
                  </span>
                </div>
              </div>
            </div>

            {/* Tarjeta Pagos Seguros y SUNAT */}
            <div className="col-span-2 rounded-2xl border border-blue-100 bg-white p-3 shadow-md transition-all hover:-translate-y-1 hover:border-emerald-600 sm:p-6 md:col-span-1 sm:rounded-3xl sm:border-2">
              <div className="flex items-start gap-3 md:block">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md sm:size-12 sm:rounded-2xl">
                  <FaShieldHalved className="size-4 sm:size-6" aria-hidden />
                </span>
                <div>
                  <h3 className="font-sans text-xs font-black uppercase text-slate-900 md:mt-4 sm:text-lg">
                    Garantía y Facturación SUNAT
                  </h3>
                  <p className="mt-0.5 text-[0.64rem] leading-snug text-slate-600 sm:mt-1 sm:text-xs sm:leading-relaxed">
                    Boleta o Factura con RUC 20. Cambios por talla garantizados 7 días.
                  </p>
                </div>
              </div>
              <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-2 text-[0.6rem] md:mt-4 md:grid-cols-1 md:space-y-2 md:pt-3 sm:text-xs">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <span className="text-slate-500">Comprobante:</span>
                  <span className="font-semibold text-slate-700">Boleta y Factura</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <span className="text-slate-500">Cambios:</span>
                  <span className="font-mono font-bold text-emerald-700">7 días</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <span className="text-slate-500">Medios:</span>
                  <span className="font-semibold text-slate-700">BCP, Yape, Plin</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PREGUNTAS FRECUENTES (FAQ) INTERACTIVAS */}
      <section id="faq" className="border-b border-blue-100 bg-white py-7 sm:py-12 lg:py-16">
        <div className="shell max-w-4xl space-y-4 sm:space-y-8">
          <div className="flex flex-col items-center text-center">
            <span className="rounded-full bg-purple-100 px-3 py-0.5 font-mono text-[0.55rem] font-black uppercase tracking-widest text-purple-700 sm:px-3.5 sm:py-1 sm:text-[0.62rem]">
              RESOLUCIÓN DE DUDAS
            </span>
            <h2 className="mt-1.5 font-sans text-xl font-black uppercase tracking-tight text-slate-900 sm:mt-2 sm:text-3xl">
              Preguntas Frecuentes (FAQ)
            </h2>
            <p className="mt-0.5 text-[0.7rem] text-slate-600 sm:mt-1 sm:text-sm">
              Respuestas claras sobre pagos, SUNAT, envíos, tallas y mayoristas.
            </p>
          </div>

          {/* Buscador de preguntas y Filtro por categorías */}
          <div className="space-y-2 sm:space-y-3">
            <div className="relative flex items-center">
              <FaMagnifyingGlass
                className="pointer-events-none absolute left-3 size-3 text-slate-400 sm:left-3.5 sm:size-3.5"
                aria-hidden
              />
              <input
                type="search"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Busca tu duda (Ej: Factura, Olva, mayoristas)..."
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs font-semibold text-slate-900 outline-none transition-colors focus:border-[#0055FF] focus:bg-white sm:h-11 sm:rounded-2xl sm:border-2 sm:pl-10 sm:pr-4"
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
              {(
                [
                  { id: "todas", label: "Todas" },
                  { id: "pagos", label: "Pagos" },
                  { id: "envios", label: "Envíos" },
                  { id: "tallas", label: "Tallas" },
                  { id: "mayorista", label: "Mayoristas" },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFaqFilter(cat.id)}
                  className={cn(
                    "rounded-full px-2.5 py-1 font-mono text-[0.58rem] font-bold uppercase transition-all sm:px-3.5 sm:py-1.5 sm:text-[0.68rem]",
                    faqFilter === cat.id
                      ? "bg-[#0055FF] text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Acordeones animados */}
          <div className="space-y-2 sm:space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center sm:p-8">
                <p className="text-xs text-slate-600">
                  No encontramos preguntas que coincidan con &ldquo;{faqSearch}&rdquo;. Escríbenos directamente a nuestro WhatsApp.
                </p>
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isOpen = openFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-[#0055FF]/60 sm:rounded-2xl sm:border-2"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-blue-50/40 sm:gap-4 sm:p-4"
                    >
                      <div className="flex items-center gap-2 sm:gap-2.5">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0055FF] sm:size-7">
                          <FaCircleQuestion className="size-3 sm:size-3.5" aria-hidden />
                        </span>
                        <span className="font-sans text-[0.72rem] font-black uppercase leading-snug text-slate-900 sm:text-sm">
                          {faq.q}
                        </span>
                      </div>
                      <FaChevronDown
                        className={cn(
                          "size-3 shrink-0 text-slate-400 transition-transform duration-200 sm:size-3.5",
                          isOpen && "rotate-180 text-[#0055FF]",
                        )}
                        aria-hidden
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-slate-100 bg-slate-50/60 px-3.5 py-3 sm:px-5 sm:py-4"
                        >
                          <p className="text-[0.7rem] leading-relaxed text-slate-700 sm:text-sm">{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* 6. BANNER DE CANALES OFICIALES DE SOPORTE DIRECTO */}
      <section className="bg-gradient-to-r from-[#0055FF] via-[#1D4ED8] to-[#1E3A8A] py-7 text-white sm:py-12 lg:py-16">
        <div className="shell max-w-5xl">
          <div className="rounded-2xl border-2 border-white/20 bg-slate-950/40 p-4 backdrop-blur-md sm:rounded-3xl sm:p-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
              <div className="max-w-xl space-y-1.5 sm:space-y-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EF233C] px-2.5 py-0.5 font-mono text-[0.54rem] font-black uppercase tracking-widest text-white shadow-xs sm:gap-1.5 sm:px-3 sm:text-[0.62rem]">
                  <FaHeadset className="size-2.5 sm:size-3" aria-hidden />
                  <span>SOPORTE EN TIEMPO REAL</span>
                </span>
                <h2 className="font-sans text-lg font-black uppercase tracking-tight text-white sm:text-3xl">
                  ¿Tienes una consulta sobre tu pedido o cotización?
                </h2>
                <p className="text-[0.7rem] text-blue-100 sm:text-sm">
                  Nuestro equipo de atención y asesores mayoristas están listos para asistirte.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1 text-[0.62rem] font-semibold text-white sm:gap-3 sm:pt-2 sm:text-xs">
                  <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 sm:gap-1.5 sm:px-3 sm:py-1">
                    <FaClock className="size-2.5 text-amber-300 sm:size-3" aria-hidden />
                    <span>Lun – Sáb · 9 a 20h</span>
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 sm:gap-1.5 sm:px-3 sm:py-1">
                    <FaLocationDot className="size-2.5 text-cyan-300 sm:size-3" aria-hidden />
                    <span>Lima, Perú</span>
                  </span>
                </div>
              </div>

              <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:flex-row lg:flex-col sm:gap-2.5">
                <a
                  href="https://wa.me/51926922583?text=Hola%20American%20Colt,%20deseo%20comunicarme%20con%20un%20asesor%20comercial."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 font-sans text-[0.64rem] font-black uppercase tracking-wider text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#1ebe5b] sm:h-12 sm:gap-2.5 sm:rounded-2xl sm:px-6 sm:text-xs"
                >
                  <SiWhatsapp className="size-3.5 sm:size-4" aria-hidden />
                  <span>WhatsApp</span>
                </a>

                <a
                  href="mailto:ventas@americancolt.pe"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-white/80 bg-white/15 px-3 font-mono text-[0.6rem] font-bold uppercase tracking-wider text-white backdrop-blur-xs transition-colors hover:bg-white hover:text-[#0055FF] sm:h-11 sm:gap-2 sm:rounded-2xl sm:border-2 sm:px-5 sm:text-xs"
                >
                  <FaEnvelope className="size-3 sm:size-3.5" aria-hidden />
                  <span className="truncate">ventas@americancolt.pe</span>
                </a>

                <Link
                  href="/libro-de-reclamaciones"
                  className="col-span-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-white/40 bg-slate-950/40 px-4 font-mono text-[0.6rem] font-bold uppercase tracking-wider text-white/90 transition-colors hover:bg-white/20 hover:text-white sm:h-10 sm:gap-2 sm:rounded-2xl sm:text-[0.68rem]"
                >
                  <FaReceipt className="size-3 text-amber-300" aria-hidden />
                  <span>Libro de Reclamaciones</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
