import type { Metadata } from "next";
import Link from "next/link";
import { FileCheck, RefreshCw, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Políticas Comerciales y Privacidad | INVESTMENTS",
  description:
    "Términos y condiciones de compra, política de privacidad según Ley N° 29733 y condiciones de cambios y devoluciones en INVESTMENTS.",
};

export default function PoliticasPage() {
  return (
    <div className="bg-paper pt-[7.5rem] pb-24 lg:pt-[8.75rem]">
      <div className="shell max-w-4xl space-y-16">
        <header className="border-b border-ink/10 pb-8">
          <p className="eyebrow text-cochinilla">Marco Legal y Transparencia</p>
          <h1 className="mt-2 font-display text-display-md text-ink">
            Políticas y <em>Términos Comerciales.</em>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-taupe-600">
            En INVESTMENTS nos regimos bajo los más altos estándares de protección al consumidor, seguridad de datos y transparencia comercial para compras minoristas (B2C) y corporativas (B2B).
          </p>
        </header>

        {/* Términos y Condiciones */}
        <section id="terminos" className="space-y-4">
          <div className="flex items-center gap-2.5 text-cochinilla border-b border-ink/10 pb-3">
            <FileCheck className="size-5" />
            <h2 className="font-display text-2xl text-ink">Términos y Condiciones de Uso</h2>
          </div>
          <div className="space-y-3 text-xs leading-relaxed text-taupe-700">
            <p>
              El acceso y uso de la plataforma digital INVESTMENTS (www.investments.pe) se rige por las leyes de la República del Perú y las condiciones estipuladas en el presente documento.
            </p>
            <p>
              <strong>1. Precios y Moneda:</strong> Todos los precios publicados en el catálogo se encuentran expresados en Nuevos Soles (PEN) e incluyen el Impuesto General a las Ventas (IGV del 18%), salvo en las cotizaciones corporativas donde el impuesto se desglosa expresamente para fines tributarios.
            </p>
            <p>
              <strong>2. Modalidad de Venta Minorista y Mayorista:</strong> Los clientes pueden adquirir prendas al por menor a través del checkout en línea. Las tarifas mayoristas aplican exclusivamente a cuentas empresariales acreditadas con RUC o pedidos que alcancen los mínimos de volumen configurados.
            </p>
            <p>
              <strong>3. Validez de Stock:</strong> El inventario se reserva temporalmente durante el proceso de pago. Si una orden no completa su pago dentro de la ventana de reserva (15 minutos), las unidades se liberan automáticamente para otros compradores.
            </p>
          </div>
        </section>

        {/* Privacidad de Datos */}
        <section id="privacidad" className="space-y-4">
          <div className="flex items-center gap-2.5 text-cochinilla border-b border-ink/10 pb-3">
            <Lock className="size-5" />
            <h2 className="font-display text-2xl text-ink">Política de Privacidad y Protección de Datos</h2>
          </div>
          <div className="space-y-3 text-xs leading-relaxed text-taupe-700">
            <p>
              En cumplimiento de la Ley N° 29733 (Ley de Protección de Datos Personales) y su Reglamento aprobado por D.S. 003-2013-JUS, INVESTMENTS garantiza la confidencialidad, seguridad y adecuado tratamiento de los datos suministrados por sus usuarios.
            </p>
            <p>
              <strong>Finalidad del Tratamiento:</strong> Los datos personales recopilados (nombre, documento de identidad, dirección, correo y teléfono) tienen como fin exclusivo procesar pedidos, coordinar entregas, emitir comprobantes de pago electrónicos y brindar soporte comercial.
            </p>
            <p>
              <strong>Derechos ARCO:</strong> En cualquier momento el titular de los datos puede ejercer sus derechos de Acceso, Rectificación, Cancelación y Oposición mediante comunicación escrita dirigida a privacidad@investments.pe.
            </p>
          </div>
        </section>

        {/* Cambios y Devoluciones */}
        <section id="cambios" className="space-y-4">
          <div className="flex items-center gap-2.5 text-cochinilla border-b border-ink/10 pb-3">
            <RefreshCw className="size-5" />
            <h2 className="font-display text-2xl text-ink">Política de Cambios y Devoluciones</h2>
          </div>
          <div className="space-y-3 text-xs leading-relaxed text-taupe-700">
            <p>
              Para INVESTMENTS la satisfacción de nuestros clientes es prioritaria. Si necesitas realizar un cambio de talla o modelo, ten en cuenta las siguientes pautas:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Plazo:</strong> Hasta siete (7) días calendario posteriores a la recepción del pedido para solicitar el cambio.
              </li>
              <li>
                <strong>Condición de la Prenda:</strong> El artículo debe encontrarse sin uso, sin lavar, con sus etiquetas y empaques originales intactos, acompañado de la boleta o factura de compra.
              </li>
              <li>
                <strong>Procedimiento:</strong> Comunícate con nuestro centro de atención indicando tu número de pedido y la talla o modelo requerido para coordinar el recojo o entrega en punto autorizado.
              </li>
              <li>
                <strong>Pedidos Mayoristas:</strong> En pedidos por volumen, los cambios aplican estrictamente ante defectos de fabricación detectados dentro de las 48 horas de recibido el lote.
              </li>
            </ul>
          </div>
        </section>

        <div className="border border-ink/10 bg-[#fbfaf7] p-6 text-xs text-taupe-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p>
            ¿Tienes alguna consulta adicional sobre nuestras políticas? Contáctanos en legal@investments.pe.
          </p>
          <Link
            href="/libro-de-reclamaciones"
            className="text-cochinilla font-semibold underline-offset-4 hover:underline shrink-0"
          >
            Ir al Libro de Reclamaciones →
          </Link>
        </div>
      </div>
    </div>
  );
}

