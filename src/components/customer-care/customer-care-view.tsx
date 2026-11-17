"use client";

import { useState, useRef, useMemo, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
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
  bgImageSrc: string;
  sideCard: {
    tag: string;
    title: string;
    subtitle: string;
    highlight: string;
    imageSrc: string;
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
    secondaryCta: { label: "Guía de Tallas", href: "#tallas" },
    bgImageSrc: "/catalogo-colt/atencion-hero-banner.png",
    sideCard: {
      tag: "Asesoría en Vivo",
      title: "WhatsApp Oficial",
      subtitle: "+51 926 922 583",
      highlight: "Lunes a Sábado · 9am - 8pm",
      imageSrc: "/catalogo-colt/pantalon-king-767-model.png",
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
    secondaryCta: { label: "Rastrear Pedido", href: "/cuenta/pedidos" },
    bgImageSrc: "/catalogo-colt/atencion-envios-banner.png",
    sideCard: {
      tag: "Despacho Rápido",
      title: "Olva Courier & Shalom",
      subtitle: "Código de seguimiento",
      highlight: "Lima y Provincias",
      imageSrc: "/catalogo-colt/camisa-zair-model.png",
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
    secondaryCta: { label: "Ver Catálogo", href: "/catalogo?audiencia=hombre" },
    bgImageSrc: "/catalogo-colt/atencion-tallas-banner.png",
    sideCard: {
      tag: "Calce Exacto",
      title: "Drill Stretch & Denim",
      subtitle: "Skinny · Slim · Straight",
      highlight: "Cambio Garantizado",
      imageSrc: "/catalogo-colt/jean-comfort-762-model.png",
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
    colorClass: "from-[#EF233C] to-[#B91C24]",
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
    a: "Apenas tu pedido sale de nuestro almacén central, recibirás una notificación a tu correo y WhatsApp con el código de seguimiento de la agencia. También puedes consultar el estado en cualquier momento iniciando sesión en la sección 'Mis Pedidos' dentro de tu cuenta.",
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
      className="group/card relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-white/60 bg-white p-4 shadow-md transition-all duration-300 hover:border-[#0055FF] hover:shadow-xl"
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
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "flex size-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition-transform duration-300 group-hover/card:scale-110",
              item.colorClass,
            )}
          >
            <item.icon className="size-5" aria-hidden />
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[0.58rem] font-black uppercase tracking-wider text-slate-700">
            {item.badge}
          </span>
        </div>

        <h3 className="mt-3 font-sans text-sm font-black uppercase text-slate-900 group-hover/card:text-[#0055FF] sm:text-base">
          {item.title}
        </h3>
        <p className="mt-1 text-xs text-slate-600 leading-relaxed">{item.subtitle}</p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="font-mono text-[0.68rem] font-bold uppercase text-[#0055FF] group-hover/card:underline">
          Acceder ahora
        </span>
        <span className="flex size-6 items-center justify-center rounded-full bg-blue-50 text-[#0055FF] transition-all group-hover/card:scale-110 group-hover/card:bg-[#0055FF] group-hover/card:text-white">
          <FaArrowRight className="size-2.5" aria-hidden />
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
    <div className="bg-white pt-[6rem] lg:pt-[9.25rem]">
      {/* 1. HERO SLIDER INTERACTIVO DE ATENCIÓN AL CLIENTE */}
      <section className="relative overflow-hidden bg-slate-950">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative flex min-h-[440px] w-full items-center sm:min-h-[480px] lg:min-h-[500px]"
          >
            {/* Imagen de fondo nítida de lado a lado */}
            <div className="absolute inset-0">
              <Image
                src={slide.bgImageSrc}
                alt={slide.titleLine1}
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>

            {/* Sombra para contraste cinematográfico */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent"
            />

            <div className="shell relative z-10 flex w-full flex-col items-start justify-between gap-6 py-8 lg:flex-row lg:items-center">
              {/* Cuadro de texto principal con transparencia moderna y texto nítido */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-[24rem] rounded-2xl border border-white/25 bg-slate-950/30 p-4 text-white shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-md sm:max-w-[27rem] sm:p-5"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#EF233C] px-2.5 py-0.5 font-mono text-[0.6rem] font-black uppercase tracking-wider text-white shadow-xs">
                    <FaHeadset className="size-2.5 text-white" aria-hidden />
                    {slide.badge}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-[#0055FF]/80 px-2.5 py-0.5 font-mono text-[0.6rem] font-extrabold uppercase tracking-wider text-white">
                    <FaCircleCheck className="size-2.5 text-white" aria-hidden />
                    {slide.promoPill}
                  </span>
                </div>

                <p className="mt-2 font-mono text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-cyan-200 drop-shadow-sm">
                  {slide.eyebrow}
                </p>

                <h1 className="mt-1 font-sans text-xl font-black uppercase leading-[1.1] tracking-tight text-white drop-shadow-md sm:text-2xl lg:text-3xl">
                  <span>{slide.titleLine1} </span>
                  <span className="mt-1 inline-block rounded-lg bg-[#EF233C] px-2.5 py-0.5 text-white">
                    {slide.titleHighlight}
                  </span>
                </h1>

                <p className="mt-2 text-xs leading-relaxed text-white/95 drop-shadow-sm sm:text-sm">
                  {slide.description}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <a
                    href={slide.primaryCta.href}
                    target={slide.primaryCta.external ? "_blank" : undefined}
                    rel={slide.primaryCta.external ? "noopener noreferrer" : undefined}
                    className="inline-flex h-9.5 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E] px-4 font-sans text-xs font-black uppercase tracking-wider text-white shadow-md transition-all hover:scale-105 hover:shadow-lg sm:h-10 sm:text-[0.75rem]"
                  >
                    <SiWhatsapp className="size-3.5" aria-hidden />
                    <span>{slide.primaryCta.label}</span>
                  </a>
                  <a
                    href={slide.secondaryCta.href}
                    className="inline-flex h-9.5 items-center justify-center gap-1.5 rounded-full border border-white/80 bg-white/20 px-4 text-xs font-black uppercase tracking-wider text-white backdrop-blur-xs transition-all hover:scale-105 hover:bg-white hover:text-[#0055FF] sm:h-10 sm:text-[0.75rem]"
                  >
                    <span>{slide.secondaryCta.label}</span>
                    <FaArrowRight className="size-3" aria-hidden />
                  </a>
                </div>
              </motion.div>

              {/* Tarjeta Visual de Soporte al Costado (3D / Imagen con modelo) */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="hidden sm:block"
              >
                <div className="w-56 overflow-hidden rounded-3xl border-3 border-white bg-white p-2.5 shadow-[0_24px_55px_rgba(0,0,0,0.55)] transition-all hover:-translate-y-1 hover:border-[#0055FF]">
                  <div className="relative aspect-[3/3.8] w-full overflow-hidden rounded-2xl bg-slate-100">
                    <Image
                      src={slide.sideCard.imageSrc}
                      alt={slide.sideCard.title}
                      fill
                      sizes="220px"
                      className="object-cover"
                    />
                    <span className="absolute left-2 top-2 rounded-full bg-[#EF233C] px-2.5 py-0.5 font-mono text-[0.52rem] font-extrabold uppercase text-white shadow-sm">
                      {slide.sideCard.tag}
                    </span>
                  </div>
                  <div className="mt-2 px-1">
                    <p className="font-sans text-xs font-black uppercase text-slate-900">
                      {slide.sideCard.title}
                    </p>
                    <p className="font-mono text-[0.68rem] font-bold text-[#0055FF]">
                      {slide.sideCard.subtitle}
                    </p>
                    <p className="mt-0.5 text-[0.62rem] text-slate-500">{slide.sideCard.highlight}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Flechas de navegación del carrusel */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Diapositiva anterior"
          className="absolute left-3 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white bg-slate-950/60 text-white shadow-md backdrop-blur-md transition-transform hover:scale-110 hover:bg-[#0055FF] sm:size-10"
        >
          <FaChevronLeft className="size-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Siguiente diapositiva"
          className="absolute right-3 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white bg-slate-950/60 text-white shadow-md backdrop-blur-md transition-transform hover:scale-110 hover:bg-[#0055FF] sm:size-10"
        >
          <FaChevronRight className="size-3.5" aria-hidden />
        </button>

        {/* Pestañas inferiores del carrusel */}
        <div className="border-t border-white/10 bg-slate-950/80 backdrop-blur-md">
          <div className="shell grid grid-cols-3 gap-2 py-2">
            {CARE_SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSlideIdx(idx)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-center font-sans text-xs font-black uppercase tracking-wider transition-all",
                  idx === slideIdx
                    ? "bg-[#0055FF] text-white shadow-md"
                    : "text-slate-400 hover:text-white",
                )}
              >
                {s.titleHighlight}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. CUADRÍCULA DE 4 TARJETAS 3D MAGNÉTICAS */}
      <section className="border-b border-blue-100 bg-gradient-to-b from-blue-50/50 to-white py-10 lg:py-12">
        <div className="shell">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="rounded-full bg-[#0055FF]/10 px-3 py-1 font-mono text-[0.62rem] font-black uppercase tracking-widest text-[#0055FF]">
              SERVICIOS Y CANALES DIRECTOS
            </span>
            <h2 className="mt-1 font-sans text-xl font-black uppercase tracking-tight text-slate-900 sm:text-2xl">
              ¿En qué podemos ayudarte hoy?
            </h2>
            <p className="mt-1 max-w-xl text-xs text-slate-600 sm:text-sm">
              Selecciona cualquiera de las opciones para acceder al instante a la información oficial y asesoría en vivo.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_CARDS.map((card) => (
              <TiltQuickCard key={card.id} item={card} />
            ))}
          </div>

          {/* Banner Destacado: Gestión Oficial de Cambio de Talla con Subida de Fotos */}
          <div className="mt-6 overflow-hidden rounded-3xl border-2 border-red-200 bg-gradient-to-r from-[#91151B] via-[#B91C24] to-[#041C4A] p-5 text-white shadow-xl sm:p-6">
            <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-0.5 font-mono text-[0.58rem] font-black uppercase tracking-wider text-[#B91C24] shadow-xs">
                  <FaRotateLeft className="size-2.5" aria-hidden />
                  <span>GARANTÍA DE CAMBIO DE TALLA</span>
                </span>
                <h3 className="mt-2 font-sans text-lg font-black uppercase text-white sm:text-xl">
                  ¿Pediste una prenda y la talla te quedó grande o chica?
                </h3>
                <p className="mt-1 text-xs text-white/90 leading-relaxed sm:text-sm">
                  Solicita tu cambio en línea con tu número de pedido o boleta, sube fotos de la prenda y coordina de inmediato por WhatsApp con un asesor.
                </p>
              </div>

              <Link
                href="/cambios-y-devoluciones"
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-6 font-sans text-xs font-black uppercase tracking-wider text-[#B91C24] shadow-lg transition-transform hover:scale-105 hover:bg-slate-100"
              >
                <span>Solicitar Cambio de Talla Ahora</span>
                <FaArrowRight className="size-3" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECCIÓN INTERACTIVA DE GUÍA DE TALLAS ANATÓMICAS */}
      <section id="tallas" className="border-b border-blue-100 bg-white py-12 lg:py-16">
        <div className="shell space-y-8">
          <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EF233C] px-3 py-0.5 font-mono text-[0.6rem] font-black uppercase tracking-wider text-white">
                <FaRulerCombined className="size-2.5" aria-hidden />
                <span>TABLA ANATÓMICA OFICIAL 2026</span>
              </span>
              <h2 className="mt-2 font-sans text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl">
                Guía de Tallas & Calce Perfecto
              </h2>
              <p className="mt-1 max-w-2xl text-xs text-slate-600 sm:text-sm">
                Nuestras prendas cuentan con patrones exactos confeccionados en el Perú. Revisa las medidas corporales y de prenda terminada para asegurar tu entalle ideal.
              </p>
            </div>

            <Link
              href={sizeCat.catalogHref}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0055FF] to-[#1D4ED8] px-5 py-2.5 font-mono text-xs font-black uppercase tracking-wider text-white shadow-md transition-transform hover:scale-105"
            >
              <span>Ver Modelos en Catálogo</span>
              <FaArrowRight className="size-3" aria-hidden />
            </Link>
          </div>

          {/* Selector de categoría de prenda */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {SIZE_CATEGORIES.map((cat, idx) => {
              const active = idx === activeSizeCategory;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveSizeCategory(idx)}
                  className={cn(
                    "flex shrink-0 flex-col items-start rounded-2xl border px-4 py-2.5 text-left transition-all",
                    active
                      ? "border-[#0055FF] bg-gradient-to-r from-[#0055FF] to-[#1D4ED8] text-white shadow-lg scale-102"
                      : "border-slate-200 bg-slate-50 text-slate-800 hover:border-[#0055FF]/40 hover:bg-blue-50",
                  )}
                >
                  <span className="font-sans text-xs font-black uppercase tracking-wide">
                    {cat.label}
                  </span>
                  <span className={cn("text-[0.65rem]", active ? "text-blue-100" : "text-slate-500")}>
                    {cat.sub}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tabla de Medidas con Imagen del Modelo */}
          <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
            {/* Tabla de Tallas */}
            <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-md lg:col-span-8">
              <div className="border-b border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans text-base font-black uppercase text-slate-900">
                    Medidas: {sizeCat.label}
                  </h3>
                  <span className="rounded-full bg-blue-100 px-3 py-0.5 font-mono text-[0.62rem] font-bold text-[#0055FF]">
                    En centímetros (cm)
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{sizeCat.fitDescription}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-blue-50/60 font-mono text-[0.65rem] font-black uppercase tracking-wider text-slate-700">
                      {sizeCat.headers.map((h) => (
                        <th key={h} className="px-4 py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sizeCat.rows.map((r, i) => (
                      <tr key={r.size} className={cn("hover:bg-blue-50/40", i % 2 === 0 ? "bg-white" : "bg-slate-50/40")}>
                        <td className="px-4 py-3 font-mono font-black text-[#0055FF]">
                          Talla {r.size}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-700">{r.col1}</td>
                        <td className="px-4 py-3 font-semibold text-slate-700">{r.col2}</td>
                        <td className="px-4 py-3 font-semibold text-slate-700">{r.col3}</td>
                        <td className="px-4 py-3 font-semibold text-slate-700">{r.col4}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tarjeta Visual y Consejos de Medición */}
            <div className="space-y-4 lg:col-span-4">
              <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-50 p-3.5 shadow-sm">
                <div className="relative aspect-[3/3.6] w-full overflow-hidden rounded-xl bg-slate-200">
                  <Image
                    src={sizeCat.imageSrc}
                    alt={sizeCat.label}
                    fill
                    sizes="320px"
                    className="object-cover"
                  />
                  <span className="absolute bottom-2 left-2 rounded-full bg-slate-950/80 px-2.5 py-0.5 font-mono text-[0.55rem] font-bold text-white backdrop-blur-xs">
                    Prenda Oficial American Colt
                  </span>
                </div>
              </div>

              {/* Guía rápida: ¿Cómo medirte? */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
                <h4 className="flex items-center gap-1.5 font-sans text-xs font-black uppercase text-[#0055FF]">
                  <FaRulerCombined className="size-3.5" aria-hidden />
                  <span>¿Cómo medirte correctamente?</span>
                </h4>
                <ul className="mt-2.5 space-y-1.5 text-xs text-slate-700 leading-snug">
                  <li>
                    <strong className="text-slate-900">1. Cintura:</strong> Mide el contorno natural donde normalmente asienta tu pantalón.
                  </li>
                  <li>
                    <strong className="text-slate-900">2. Cadera:</strong> Coloca la cinta métrica en la parte más ancha de los glúteos.
                  </li>
                  <li>
                    <strong className="text-slate-900">3. Largo:</strong> Mide desde la entrepierna hasta el tobillo exterior.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECCIÓN DE ENVÍOS Y COBERTURA NACIONAL */}
      <section id="envios" className="border-b border-blue-100 bg-slate-50 py-12 lg:py-16">
        <div className="shell space-y-8">
          <div className="flex flex-col items-center text-center">
            <span className="rounded-full bg-[#0055FF] px-3.5 py-1 font-mono text-[0.62rem] font-black uppercase tracking-widest text-white shadow-xs">
              LOGÍSTICA Y DESPACHO EXCLUSIVO
            </span>
            <h2 className="mt-2 font-sans text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl">
              Envíos y Cobertura Nacional
            </h2>
            <p className="mt-1 max-w-2xl text-xs text-slate-600 sm:text-sm">
              Llegamos a cada rincón del Perú con embalaje sellado de fábrica y seguimiento en tiempo real.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Tarjeta Lima */}
            <div className="rounded-3xl border-2 border-blue-100 bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:border-[#0055FF]">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0055FF] to-[#1D4ED8] text-white shadow-md">
                <FaTruckFast className="size-6" aria-hidden />
              </span>
              <h3 className="mt-4 font-sans text-lg font-black uppercase text-slate-900">
                Lima Metropolitana & Callao
              </h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Despacho en 24 a 48 horas hábiles mediante motorizado express directo a tu puerta o centro laboral.
              </p>
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tarifa estándar:</span>
                  <span className="font-mono font-bold text-slate-900">S/ 12.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Envío Gratis:</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-mono font-black text-emerald-800">
                    Compras &gt; S/ 199
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Horario entrega:</span>
                  <span className="font-semibold text-slate-700">9:00 a 19:00 hrs</span>
                </div>
              </div>
            </div>

            {/* Tarjeta Provincias */}
            <div className="rounded-3xl border-2 border-blue-100 bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:border-[#EF233C]">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EF233C] to-[#B91C24] text-white shadow-md">
                <FaLocationDot className="size-6" aria-hidden />
              </span>
              <h3 className="mt-4 font-sans text-lg font-black uppercase text-slate-900">
                Provincias (Todo el Perú)
              </h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Envíos consolidados a las 25 regiones a través de agencias autorizadas como Olva Courier y Shalom Empresarial.
              </p>
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tiempo estimado:</span>
                  <span className="font-mono font-bold text-[#EF233C]">48 a 72 hrs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Modalidad:</span>
                  <span className="font-semibold text-slate-700">Domicilio o Agencia</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Seguimiento:</span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 font-mono font-bold text-[#0055FF]">
                    Código Online
                  </span>
                </div>
              </div>
            </div>

            {/* Tarjeta Pagos Seguros y SUNAT */}
            <div className="rounded-3xl border-2 border-blue-100 bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:border-emerald-600">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md">
                <FaShieldHalved className="size-6" aria-hidden />
              </span>
              <h3 className="mt-4 font-sans text-lg font-black uppercase text-slate-900">
                Garantía y Facturación SUNAT
              </h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Tus transacciones están encriptadas. Emitimos Boleta o Factura con RUC 20 para personas naturales y empresas.
              </p>
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Comprobante:</span>
                  <span className="font-semibold text-slate-700">Boleta y Factura</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Cambio de Talla:</span>
                  <span className="font-mono font-bold text-emerald-700">7 días garantizados</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Cuentas Bancarias:</span>
                  <span className="font-semibold text-slate-700">BCP, BBVA, Yape, Plin</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PREGUNTAS FRECUENTES (FAQ) INTERACTIVAS */}
      <section id="faq" className="border-b border-blue-100 bg-white py-12 lg:py-16">
        <div className="shell max-w-4xl space-y-8">
          <div className="flex flex-col items-center text-center">
            <span className="rounded-full bg-purple-100 px-3.5 py-1 font-mono text-[0.62rem] font-black uppercase tracking-widest text-purple-700">
              RESOLUCIÓN DE DUDAS INMEDIATA
            </span>
            <h2 className="mt-2 font-sans text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl">
              Preguntas Frecuentes (FAQ)
            </h2>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
              Encuentra respuestas claras sobre pagos, comprobantes SUNAT, envíos, tallas y ventas por mayor.
            </p>
          </div>

          {/* Buscador de preguntas y Filtro por categorías */}
          <div className="space-y-3">
            <div className="relative flex items-center">
              <FaMagnifyingGlass
                className="pointer-events-none absolute left-3.5 size-3.5 text-slate-400"
                aria-hidden
              />
              <input
                type="search"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Busca tu duda (Ej: Factura, Olva, devoluciones, precios mayoristas)..."
                className="h-11 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none transition-colors focus:border-[#0055FF] focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {(
                [
                  { id: "todas", label: "Todas las preguntas" },
                  { id: "pagos", label: "Pagos y SUNAT" },
                  { id: "envios", label: "Envíos y Entregas" },
                  { id: "tallas", label: "Tallas y Cambios" },
                  { id: "mayorista", label: "Mayoristas B2B" },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFaqFilter(cat.id)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 font-mono text-[0.68rem] font-bold uppercase transition-all",
                    faqFilter === cat.id
                      ? "bg-[#0055FF] text-white shadow-xs scale-105"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Acordeones animados */}
          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                <p className="text-xs text-slate-600">
                  No encontramos preguntas que coincidan con &ldquo;{faqSearch}&rdquo;. Escríbenos directamente a nuestro WhatsApp para ayudarte al instante.
                </p>
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isOpen = openFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white transition-all hover:border-[#0055FF]/60"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-blue-50/40"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0055FF]">
                          <FaCircleQuestion className="size-3.5" aria-hidden />
                        </span>
                        <span className="font-sans text-xs font-black uppercase text-slate-900 sm:text-sm">
                          {faq.q}
                        </span>
                      </div>
                      <FaChevronDown
                        className={cn(
                          "size-3.5 shrink-0 text-slate-400 transition-transform duration-200",
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
                          className="border-t border-slate-100 bg-slate-50/60 px-5 py-4"
                        >
                          <p className="text-xs leading-relaxed text-slate-700 sm:text-sm">{faq.a}</p>
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
      <section className="bg-gradient-to-r from-[#0055FF] via-[#1D4ED8] to-[#91151B] py-12 text-white lg:py-16">
        <div className="shell max-w-5xl">
          <div className="rounded-3xl border-2 border-white/20 bg-slate-950/40 p-6 backdrop-blur-md sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EF233C] px-3 py-0.5 font-mono text-[0.62rem] font-black uppercase tracking-widest text-white shadow-xs">
                  <FaHeadset className="size-3" aria-hidden />
                  <span>SOPORTE HUMANO EN TIEMPO REAL</span>
                </span>
                <h2 className="font-sans text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                  ¿Tienes una consulta específica sobre tu pedido o cotización?
                </h2>
                <p className="text-xs text-blue-100 sm:text-sm">
                  Nuestro equipo de atención al cliente y asesores de venta por mayor están listos para asistirte.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-white">
                  <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1">
                    <FaClock className="size-3 text-amber-300" aria-hidden />
                    <span>Lun – Sáb · 9:00 a 20:00 hrs</span>
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1">
                    <FaLocationDot className="size-3 text-cyan-300" aria-hidden />
                    <span>Lima, Perú</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col shrink-0">
                <a
                  href="https://wa.me/51926922583?text=Hola%20American%20Colt,%20deseo%20comunicarme%20con%20un%20asesor%20comercial."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-6 font-sans text-xs font-black uppercase tracking-wider text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#1ebe5b]"
                >
                  <SiWhatsapp className="size-4" aria-hidden />
                  <span>Chatear por WhatsApp</span>
                </a>

                <a
                  href="mailto:ventas@americancolt.pe"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border-2 border-white/80 bg-white/15 px-5 font-mono text-xs font-bold uppercase tracking-wider text-white backdrop-blur-xs transition-colors hover:bg-white hover:text-[#0055FF]"
                >
                  <FaEnvelope className="size-3.5" aria-hidden />
                  <span>ventas@americancolt.pe</span>
                </a>

                <Link
                  href="/libro-de-reclamaciones"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-white/40 bg-slate-950/40 px-4 font-mono text-[0.68rem] font-bold uppercase tracking-wider text-white/90 transition-colors hover:bg-white/20 hover:text-white"
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
