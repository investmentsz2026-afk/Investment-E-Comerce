import { chromium } from "playwright-core";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>INVESTMENTS — Dossier Comercial de Plataforma E-Commerce B2C & B2B</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm 20mm 16mm;
      @bottom-right {
        content: "Página " counter(page);
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 8pt;
        color: #94a3b8;
      }
      @bottom-left {
        content: "INVESTMENTS — Plataforma Comercial Digital";
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 8pt;
        color: #94a3b8;
        font-weight: 600;
        letter-spacing: 0.05em;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      line-height: 1.55;
      font-size: 9.5pt;
      -webkit-font-smoothing: antialiased;
    }

    .page-break {
      page-break-after: always;
      break-after: page;
    }

    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Portada de Lujo */
    .cover-page {
      height: 100vh;
      min-height: 250mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 30mm 15mm 20mm 15mm;
      background: linear-gradient(135deg, #090d16 0%, #111827 60%, #1e293b 100%);
      color: #ffffff;
      border-radius: 8px;
      position: relative;
      overflow: hidden;
    }

    .cover-decor {
      position: absolute;
      top: -120px;
      right: -120px;
      width: 420px;
      height: 420px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(217, 119, 6, 0.18) 0%, rgba(217, 119, 6, 0) 70%);
      pointer-events: none;
    }

    .cover-brand-tag {
      display: inline-block;
      padding: 6px 16px;
      background: rgba(217, 119, 6, 0.15);
      border: 1px solid rgba(217, 119, 6, 0.4);
      color: #fbbf24;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      border-radius: 20px;
      margin-bottom: 25px;
    }

    .cover-title {
      font-family: 'Playfair Display', serif;
      font-size: 34pt;
      font-weight: 700;
      line-height: 1.15;
      color: #ffffff;
      margin-bottom: 16px;
      letter-spacing: -0.01em;
    }

    .cover-title span {
      color: #f59e0b;
      font-style: italic;
    }

    .cover-subtitle {
      font-size: 13pt;
      color: #cbd5e1;
      font-weight: 400;
      max-width: 540px;
      line-height: 1.5;
      margin-bottom: 40px;
    }

    .cover-highlights {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-top: 30px;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      padding-top: 25px;
    }

    .cover-stat-box {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 14px 16px;
      border-radius: 8px;
    }

    .cover-stat-num {
      font-size: 16pt;
      font-weight: 800;
      color: #fbbf24;
      display: block;
      margin-bottom: 4px;
    }

    .cover-stat-desc {
      font-size: 8pt;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .cover-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 8.5pt;
      color: #94a3b8;
    }

    .cover-footer strong {
      color: #ffffff;
      display: block;
      font-size: 9.5pt;
      margin-bottom: 2px;
    }

    /* Estilos Generales de Contenido */
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      margin-bottom: 22px;
      border-bottom: 2px solid #0f172a;
    }

    .brand-logo-text {
      font-family: 'Playfair Display', serif;
      font-size: 15pt;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: #0f172a;
    }

    .brand-logo-text span {
      color: #d97706;
    }

    .doc-category-badge {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #b45309;
      background: #fef3c7;
      padding: 4px 10px;
      border-radius: 4px;
    }

    h2.section-heading {
      font-family: 'Playfair Display', serif;
      font-size: 20pt;
      color: #0f172a;
      margin-bottom: 8px;
      letter-spacing: -0.01em;
    }

    p.section-sublead {
      color: #475569;
      font-size: 10pt;
      margin-bottom: 22px;
      line-height: 1.5;
    }

    /* Rejillas y Tarjetas */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 14px;
      margin-bottom: 20px;
    }

    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .card.highlight {
      background: #f8fafc;
      border-color: #cbd5e1;
      border-left: 4px solid #d97706;
    }

    .card.dark {
      background: #0f172a;
      color: #ffffff;
      border-color: #1e293b;
    }

    .card.dark .card-title {
      color: #fbbf24;
    }

    .card.dark p {
      color: #cbd5e1;
    }

    .card-icon-badge {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background: #fef3c7;
      color: #b45309;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 12pt;
      margin-bottom: 10px;
    }

    .card-title {
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
    }

    .card p {
      font-size: 9pt;
      color: #475569;
      line-height: 1.45;
    }

    /* Listas con viñetas elegantes */
    ul.luxury-list {
      list-style: none;
      margin: 10px 0;
    }

    ul.luxury-list li {
      position: relative;
      padding-left: 20px;
      margin-bottom: 8px;
      font-size: 9pt;
      color: #334155;
      line-height: 1.45;
    }

    ul.luxury-list li::before {
      content: "✔";
      position: absolute;
      left: 0;
      color: #d97706;
      font-weight: 800;
      font-size: 8.5pt;
    }

    /* Tablas Ejecutivas */
    table.executive-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0 22px 0;
      font-size: 8.8pt;
    }

    table.executive-table th {
      background: #0f172a;
      color: #ffffff;
      text-align: left;
      padding: 10px 12px;
      font-weight: 600;
      letter-spacing: 0.03em;
    }

    table.executive-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }

    table.executive-table tr:nth-child(even) {
      background: #f8fafc;
    }

    table.executive-table tr:hover {
      background: #f1f5f9;
    }

    .tag-pill {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .tag-pill.green {
      background: #dcfce7;
      color: #15803d;
    }

    .tag-pill.amber {
      background: #fef3c7;
      color: #b45309;
    }

    .tag-pill.blue {
      background: #e0f2fe;
      color: #0369a1;
    }

    /* Banner Destacado */
    .feature-banner {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 18px 20px;
      margin-bottom: 22px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .banner-title {
      font-size: 12pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .banner-desc {
      font-size: 9pt;
      color: #64748b;
      max-width: 520px;
    }

    .banner-badge {
      background: #0f172a;
      color: #fbbf24;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 9pt;
      text-align: center;
      white-space: nowrap;
    }

    /* Footer de página */
    .footer-note {
      margin-top: 25px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
      font-size: 8pt;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>

  <!-- PORTADA DE ALTA GAMA -->
  <div class="cover-page page-break">
    <div class="cover-decor"></div>
    <div>
      <div class="cover-brand-tag">Solución Integral E-Commerce</div>
      <h1 class="cover-title">INVESTMENTS<br><span>Moda & Confección Textil</span></h1>
      <p class="cover-subtitle">
        Dossier Ejecutivo de la Plataforma de Comercio Electrónico Unificada para Ventas Minoristas (B2C) y Mayoristas Corporativas (B2B) en el Perú.
      </p>
    </div>

    <div>
      <div class="cover-highlights">
        <div class="cover-stat-box">
          <span class="cover-stat-num">B2C + B2B</span>
          <span class="cover-stat-desc">Doble Canal de Ventas Integrado</span>
        </div>
        <div class="cover-stat-box">
          <span class="cover-stat-num">SUNAT 100%</span>
          <span class="cover-stat-desc">Boletas y Facturas Electrónicas</span>
        </div>
        <div class="cover-stat-box">
          <span class="cover-stat-num">Control Total</span>
          <span class="cover-stat-desc">Panel Administrativo & Kardex</span>
        </div>
      </div>

      <div class="cover-footer" style="margin-top: 35px;">
        <div>
          <strong>INVESTMENTS PERÚ S.A.C.</strong>
          <span>Documento de Entrega Comercial y Especificaciones de Plataforma</span>
        </div>
        <div style="text-align: right;">
          <strong>Versión de Producción</strong>
          <span>Listo para Despliegue en la Nube (Vercel & Neon)</span>
        </div>
      </div>
    </div>
  </div>

  <!-- PÁGINA 1: RESUMEN EJECUTIVO Y MODELO DE NEGOCIO -->
  <div class="header-bar">
    <div class="brand-logo-text">INVESTMENTS <span>•</span> DOSSIER</div>
    <div class="doc-category-badge">Visión Estratégica</div>
  </div>

  <h2 class="section-heading">1. Resumen Ejecutivo del Proyecto</h2>
  <p class="section-sublead">
    La plataforma web de <strong>INVESTMENTS</strong> ha sido concebida y desarrollada como un ecosistema comercial de alto rendimiento, diseñado específicamente para liderar el sector de moda y confecciones en el mercado peruano.
  </p>

  <div class="grid-2">
    <div class="card highlight">
      <div class="card-icon-badge">🛍️</div>
      <h3 class="card-title">Canal Minorista B2C (Público General)</h3>
      <p style="margin-bottom: 10px;">
        Experiencia de compra tipo boutique de lujo con navegación rápida, catálogo visualmente cautivador y checkout sin fricciones para clientes finales.
      </p>
      <ul class="luxury-list">
        <li>Precios minoristas oficiales en Soles (PEN).</li>
        <li>Promociones, descuentos y cupones de temporada.</li>
        <li>Emisión instantánea de Boletas de Venta Electrónicas con DNI.</li>
        <li>Seguimiento de pedidos en tiempo real y libreta de direcciones.</li>
      </ul>
    </div>

    <div class="card highlight" style="border-left-color: #0f172a;">
      <div class="card-icon-badge" style="background: #e2e8f0; color: #0f172a;">🏢</div>
      <h3 class="card-title">Canal Mayorista B2B (Empresas & Boutiques)</h3>
      <p style="margin-bottom: 10px;">
        Portal corporativo exclusivo para distribuidores, boutiques, tiendas y clientes corporativos con condiciones comerciales mayoristas.
      </p>
      <ul class="luxury-list">
        <li>Registro empresarial con validación de RUC de 11 dígitos.</li>
        <li>Tarifas por volumen escalonadas (descuentos a partir de 6 o 12 prendas).</li>
        <li>Módulo de Cotizaciones Formales para pedidos industriales.</li>
        <li>Factura Electrónica formal con Razón Social y Domicilio Fiscal.</li>
      </ul>
    </div>
  </div>

  <div class="feature-banner avoid-break">
    <div>
      <div class="banner-title">Un Solo Catálogo, Dos Precios Inteligentes</div>
      <div class="banner-desc">
        La plataforma reconoce automáticamente si quien navega es un cliente particular o una empresa autorizada, mostrando el precio que corresponde en tiempo real sin crear tiendas separadas ni duplicar productos.
      </div>
    </div>
    <div class="banner-badge">Tecnología Inteligente</div>
  </div>

  <h2 class="section-heading" style="font-size: 16pt; margin-top: 15px;">Diferenciales Competitivos para su Empresa</h2>
  <div class="grid-3 avoid-break">
    <div class="card">
      <h4 class="card-title">🚀 Rapidez Extrema</h4>
      <p>Carga en menos de 1 segundo en teléfonos móviles 4G/5G, reduciendo el abandono de compra y multiplicando las conversiones.</p>
    </div>
    <div class="card">
      <h4 class="card-title">🔒 Seguridad Bancaria</h4>
      <p>Protección total de datos contra fraudes, encriptación SSL de grado corporativo y verificación segura de pagos.</p>
    </div>
    <div class="card">
      <h4 class="card-title">🇵🇪 Adaptado al Perú</h4>
      <p>Diseñado con la geografía nacional (Lima y Provincias), moneda Soles (S/.), cálculo exacto de IGV (18%) y métodos de pago peruanos.</p>
    </div>
  </div>

  <div class="footer-note">
    <span>INVESTMENTS S.A.C. — Confidencial para el Cliente</span>
    <span>Dossier Comercial • Página 1</span>
  </div>

  <div class="page-break"></div>

  <!-- PÁGINA 2: TIENDA PÚBLICA, CATÁLOGO Y EXPERIENCIA DE COMPRA -->
  <div class="header-bar">
    <div class="brand-logo-text">INVESTMENTS <span>•</span> DOSSIER</div>
    <div class="doc-category-badge">Experiencia de Usuario</div>
  </div>

  <h2 class="section-heading">2. La Tienda Pública: Experiencia Premium</h2>
  <p class="section-sublead">
    Cada pantalla ha sido diseñada con estándares internacionales de diseño y usabilidad, transmitiendo elegancia, prestigio y confianza desde el primer clic.
  </p>

  <div class="grid-2">
    <div class="card">
      <h3 class="card-title">Catálogo Interactivo y Filtros Avanzados</h3>
      <p style="margin-bottom: 8px;">Permite al comprador encontrar exactamente la prenda deseada en segundos:</p>
      <ul class="luxury-list">
        <li><strong>Filtro por Colecciones y Categorías:</strong> Ropa de Mujer, Hombre, Abrigos, Blazers, Vestidos, Tejidos y Accesorios.</li>
        <li><strong>Filtro por Tallas y Colores:</strong> Permite visualizar disponibilidad real de tallas (XS, S, M, L, XL) y paleta de colores.</li>
        <li><strong>Rango de Precios en Soles:</strong> Control deslizante para acotar presupuestos.</li>
        <li><strong>Búsqueda Inteligente:</strong> Encuentra prendas por nombre, tela, estilo o código comercial.</li>
      </ul>
    </div>

    <div class="card">
      <h3 class="card-title">Ficha de Producto de Alto Impacto</h3>
      <p style="margin-bottom: 8px;">Pensada para maximizar la decisión de compra del cliente:</p>
      <ul class="luxury-list">
        <li><strong>Galería de Fotografías de Alta Calidad:</strong> Vistas detalladas, texturas de tela y acabados de costura.</li>
        <li><strong>Selector Dinámico de Talla y Color:</strong> El botón de compra se adapta automáticamente según el stock disponible.</li>
        <li><strong>Tabla de Escalas por Volumen:</strong> Las empresas ven claramente cuánto ahorran por cada nivel de compra (ej: -15% a partir de 6 uds., -25% a partir de 12 uds.).</li>
        <li><strong>Stock Protegido:</strong> Si una talla o color se agota, el sistema lo indica claramente impidiendo reclamos por sobreventa.</li>
      </ul>
    </div>
  </div>

  <h2 class="section-heading" style="font-size: 16pt; margin-top: 15px;">3. Carrito Inteligente y Reglas Comerciales</h2>
  <p class="section-sublead">
    El carrito de compras de INVESTMENTS no es un carrito común: incorpora un motor comercial automático que premia el volumen y protege las compras.
  </p>

  <table class="executive-table avoid-break">
    <thead>
      <tr>
        <th>Característica</th>
        <th>¿Cómo funciona?</th>
        <th>Beneficio para el Negocio</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Acumulación por Modelo</strong></td>
        <td>Si un cliente mayorista compra 3 blazers negros talla S y 3 blazers beige talla M, el sistema los agrupa (6 prendas) y desbloquea el descuento mayorista.</td>
        <td><span class="tag-pill green">Incentiva Mayor Ticket</span></td>
      </tr>
      <tr>
        <td><strong>Carrito Persistente</strong></td>
        <td>Si el visitante añade prendas y vuelve días después o inicia sesión desde su celular, su carrito se recupera intacto.</td>
        <td><span class="tag-pill blue">Recupera Ventas</span></td>
      </tr>
      <tr>
        <td><strong>Reserva Temporal</strong></td>
        <td>Al iniciar el checkout, el stock se reserva por 30 minutos para evitar que dos clientes compren la última prenda a la vez.</td>
        <td><span class="tag-pill amber">Cero Conflictos</span></td>
      </tr>
      <tr>
        <td><strong>Cálculo Transparente</strong></td>
        <td>Muestra claramente el subtotal, el desglose de IGV (18%), el costo exacto de envío y el ahorro total obtenido.</td>
        <td><span class="tag-pill green">Confianza Total</span></td>
      </tr>
    </tbody>
  </table>

  <div class="card dark avoid-break">
    <h3 class="card-title">Módulo Exclusivo: Cotizaciones Corporativas B2B</h3>
    <p>
      Para pedidos de gran envergadura (más de 50 o 100 prendas para empresas, corporaciones o licitaciones), la plataforma incluye un sistema de cotizaciones donde el cliente empresarial solicita una propuesta formal. El administrador define un precio especial, plazo de pago y fecha de vencimiento. La empresa puede aceptar la cotización con un solo clic y convertirla en pedido oficial.
    </p>
  </div>

  <div class="footer-note">
    <span>INVESTMENTS S.A.C. — Confidencial para el Cliente</span>
    <span>Dossier Comercial • Página 2</span>
  </div>

  <div class="page-break"></div>

  <!-- PÁGINA 3: CHECKOUT, LOGÍSTICA, PAGOS Y SUNAT -->
  <div class="header-bar">
    <div class="brand-logo-text">INVESTMENTS <span>•</span> DOSSIER</div>
    <div class="doc-category-badge">Operaciones & Pagos</div>
  </div>

  <h2 class="section-heading">4. Checkout, Pasarelas de Pago y Logística Nacional</h2>
  <p class="section-sublead">
    Un proceso de pago diseñado para el consumidor peruano, eliminando pasos innecesarios y garantizando la recaudación bancaria segura de su dinero.
  </p>

  <div class="grid-3">
    <div class="card">
      <div class="card-icon-badge">💳</div>
      <h4 class="card-title">Tarjetas de Crédito y Débito</h4>
      <p>Aceptación inmediata de Visa, Mastercard, American Express y Diners Club mediante pasarelas líderes en Perú (Mercado Pago / Culqi).</p>
    </div>
    <div class="card">
      <div class="card-icon-badge">📱</div>
      <h4 class="card-title">Billeteras Móviles (Yape & Plin)</h4>
      <p>Facilidad de pago desde el celular con códigos QR y confirmación digital sin necesidad de enviar capturas de pantalla.</p>
    </div>
    <div class="card">
      <div class="card-icon-badge">🏦</div>
      <h4 class="card-title">Transferencia Bancaria & CCI</h4>
      <p>Ideal para empresas mayoristas. Muestra instrucciones con los números de cuenta en Soles (BCP, Interbank, BBVA) y genera orden en espera.</p>
    </div>
  </div>

  <div class="grid-2 avoid-break">
    <div class="card highlight">
      <h3 class="card-title">🚚 Envíos Inteligentes por Zonas Geográficas</h3>
      <p style="margin-bottom: 8px;">Cálculo dinámico según el destino peruano seleccionado:</p>
      <ul class="luxury-list">
        <li><strong>Lima Metropolitana:</strong> Tarifa local fija con entrega rápida (ej: S/ 15.00).</li>
        <li><strong>Lima Provincias & Ciudades Principales:</strong> Tarifa interprovincial automática (Arequipa, Trujillo, Cusco, Chiclayo, Huancayo, etc.).</li>
        <li><strong>Envío Gratuito Automático:</strong> Configurable a partir de cierto monto de compra (ej: compras mayores a S/ 250.00 reciben envío gratis).</li>
        <li><strong>Bloqueo de Zonas sin Cobertura:</strong> Avisa amablemente si no hay cobertura de transporte en zonas remotas, evitando problemas de despacho.</li>
      </ul>
    </div>

    <div class="card highlight" style="border-left-color: #15803d;">
      <h3 class="card-title">🧾 Facturación Electrónica SUNAT Integrada</h3>
      <p style="margin-bottom: 8px;">Cumplimiento tributario riguroso conforme a la ley peruana:</p>
      <ul class="luxury-list">
        <li><strong>Boleta de Venta Electrónica:</strong> Solicitada con DNI o Carné de Extranjería (CE) para compras de personas naturales.</li>
        <li><strong>Factura Electrónica con Crédito Fiscal:</strong> Requiere RUC válido de 11 dígitos, Razón Social y Domicilio Fiscal para empresas.</li>
        <li><strong>Desglose Tributario Exacto:</strong> Cálculo matemático inalterable de Base Imponible + IGV 18% = Total a Pagar.</li>
        <li><strong>Conexión Homologada:</strong> Arquitectura lista para timbrar con el Proveedor de Servicios Electrónicos (PSE/OSE Nubefact u homologados).</li>
      </ul>
    </div>
  </div>

  <h2 class="section-heading" style="font-size: 16pt; margin-top: 15px;">Seguridad y Notificaciones al Cliente</h2>
  <div class="grid-2 avoid-break">
    <div class="card">
      <h4 class="card-title">✉️ Correos Automáticos de Estado</h4>
      <p>El cliente recibe un correo profesional con el detalle de su compra, comprobante adjunto y fecha estimada de entrega apenas se confirma el pago.</p>
    </div>
    <div class="card">
      <h4 class="card-title">📦 Seguimiento con Guía de Tracking</h4>
      <p>Al despachar el paquete con Olva Courier, Shalom o transporte propio, el administrador ingresa el número de seguimiento y el cliente puede rastrearlo.</p>
    </div>
  </div>

  <div class="footer-note">
    <span>INVESTMENTS S.A.C. — Confidencial para el Cliente</span>
    <span>Dossier Comercial • Página 3</span>
  </div>

  <div class="page-break"></div>

  <!-- PÁGINA 4: PANEL DE CONTROL Y ADMINISTRACIÓN INTEGRAL -->
  <div class="header-bar">
    <div class="brand-logo-text">INVESTMENTS <span>•</span> DOSSIER</div>
    <div class="doc-category-badge">Gestión del Negocio</div>
  </div>

  <h2 class="section-heading">5. Panel Administrativo: Control Total del Negocio</h2>
  <p class="section-sublead">
    El corazón operativo de la empresa. Una interfaz administrativa privada, moderna y profesional donde el dueño y su equipo gestionan todo sin tocar código.
  </p>

  <div class="grid-3">
    <div class="card">
      <div class="card-icon-badge">📊</div>
      <h4 class="card-title">Dashboard Comercial</h4>
      <p>Visualización de métricas en tiempo real: ingresos totales del mes, ticket promedio, cantidad de pedidos y comparativa de ventas B2C vs B2B.</p>
    </div>
    <div class="card">
      <div class="card-icon-badge">👗</div>
      <h4 class="card-title">Gestor de Productos</h4>
      <p>Creación y edición de prendas con fotos, tallas, colores, descripción, precio minorista y tablas de escalas mayoristas con un solo clic.</p>
    </div>
    <div class="card">
      <div class="card-icon-badge">📦</div>
      <h4 class="card-title">Inventario & Kardex</h4>
      <p>Control exacto de almacén. Registro de ingresos de lote, mermas de taller, historial auditado y alertas automáticas de bajo stock.</p>
    </div>
  </div>

  <div class="grid-3 avoid-break">
    <div class="card">
      <div class="card-icon-badge">📑</div>
      <h4 class="card-title">Gestión de Pedidos</h4>
      <p>Control de pedidos por estado (Pendiente, Pagado, En Preparación, Despachado, Entregado) con generación de guías y reembolsos seguros.</p>
    </div>
    <div class="card">
      <div class="card-icon-badge">💼</div>
      <h4 class="card-title">Solicitudes Mayoristas</h4>
      <p>Revisión de solicitudes de empresas que quieren comprar por mayor. El administrador evalúa su RUC y aprueba o suspende su acceso con un clic.</p>
    </div>
    <div class="card">
      <div class="card-icon-badge">🏷️</div>
      <h4 class="card-title">Promociones & Descuentos</h4>
      <p>Creación de campañas de descuento (ej: -20% en prendas de invierno) con fecha de inicio y vencimiento programadas automáticamente.</p>
    </div>
  </div>

  <h2 class="section-heading" style="font-size: 16pt; margin-top: 15px;">Resumen de Capacidades del Sistema Administrativo</h2>

  <table class="executive-table avoid-break">
    <thead>
      <tr>
        <th>Módulo Administrativo</th>
        <th>Funcionalidades Clave</th>
        <th>Impacto Operativo</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Kardex de Inventario</strong></td>
        <td>Movimientos auditados con fecha, responsable y motivo. Bloqueo matemático que impide dejar stock negativo.</td>
        <td>Elimina pérdidas de mercadería y desorden de almacén.</td>
      </tr>
      <tr>
        <td><strong>Ficha 360° de Clientes</strong></td>
        <td>Búsqueda por RUC, DNI o correo. Visualización de historial de compras, facturas emitidas y estado crediticio.</td>
        <td>Permite brindar atención VIP y personalizada a grandes clientes.</td>
      </tr>
      <tr>
        <td><strong>Gestor de Cotizaciones</strong></td>
        <td>Respuestas a requerimientos corporativos, fijación de precios especiales por variante y condiciones de pago.</td>
        <td>Cierra ventas mayoristas de gran volumen con rapidez.</td>
      </tr>
      <tr>
        <td><strong>Seguridad de Acceso</strong></td>
        <td>Panel protegido con validación de roles en servidor. Nadie ajeno a la empresa puede ingresar o ver información comercial.</td>
        <td>Protege la información financiera y confidencial de la empresa.</td>
      </tr>
    </tbody>
  </table>

  <div class="feature-banner avoid-break" style="background: #0f172a; color: #ffffff; border-color: #1e293b;">
    <div>
      <div class="banner-title" style="color: #fbbf24;">Listo para Operar desde Cualquier Lugar</div>
      <div class="banner-desc" style="color: #cbd5e1;">
        El panel de administración funciona tanto en computadoras de escritorio como en tablets y smartphones, permitiendo a la gerencia supervisar ventas y despachos en cualquier momento.
      </div>
    </div>
    <div class="banner-badge" style="background: #fbbf24; color: #0f172a;">Multi-Dispositivo</div>
  </div>

  <div class="footer-note">
    <span>INVESTMENTS S.A.C. — Confidencial para el Cliente</span>
    <span>Dossier Comercial • Página 4</span>
  </div>

  <div class="page-break"></div>

  <!-- PÁGINA 5: INFRAESTRUCTURA, SEGURIDAD Y CONCLUSIÓN -->
  <div class="header-bar">
    <div class="brand-logo-text">INVESTMENTS <span>•</span> DOSSIER</div>
    <div class="doc-category-badge">Garantía & Crecimiento</div>
  </div>

  <h2 class="section-heading">6. Infraestructura Tecnológica & Seguridad</h2>
  <p class="section-sublead">
    La plataforma está montada sobre la misma infraestructura en la nube utilizada por las principales compañías de tecnología a nivel global, asegurando disponibilidad del 99.9% y escalabilidad ilimitada.
  </p>

  <div class="grid-2">
    <div class="card highlight">
      <h3 class="card-title">🛡️ Seguridad y Protección de Datos</h3>
      <ul class="luxury-list">
        <li><strong>Cifrado SSL de Extremo a Extremo:</strong> Todas las transacciones viajan encriptadas mediante protocolo HTTPS de alta seguridad.</li>
        <li><strong>Protección contra Ataques Cibernéticos:</strong> Cabeceras de seguridad avanzadas (CSP, Anti-Clickjacking y aislamiento de sesiones).</li>
        <li><strong>Contraseñas Blindadas:</strong> Algoritmo de encriptación militar (scrypt con sales criptográficas aleatorias) para que ninguna contraseña pueda ser descifrada.</li>
        <li><strong>Copias de Seguridad Continuas:</strong> Base de datos Neon PostgreSQL con respaldos automáticos y recuperación ante desastres.</li>
      </ul>
    </div>

    <div class="card highlight" style="border-left-color: #0284c7;">
      <h3 class="card-title">⚡ Desempeño y Escalabilidad</h3>
      <ul class="luxury-list">
        <li><strong>Alojamiento en Servidores Globales:</strong> Desplegado en Vercel con red de distribución de contenido (CDN) ultrarrápida.</li>
        <li><strong>Capacidad para Picos de Tráfico:</strong> Soporta miles de visitantes simultáneos durante campañas como Cyber Wow, Black Friday o Día de la Madre sin caerse.</li>
        <li><strong>Optimización SEO para Google:</strong> Sitemap automático, metadatos y arquitectura optimizada para aparecer en las primeras posiciones de búsqueda.</li>
        <li><strong>Imágenes Optimizadas:</strong> Carga de fotografías en formatos modernos de última generación (WebP / AVIF) sin perder calidad visual.</li>
      </ul>
    </div>
  </div>

  <h2 class="section-heading" style="font-size: 16pt; margin-top: 15px;">7. Conclusión: Una Inversión Rentable y Lista para Crecer</h2>
  <div class="card avoid-break" style="background: #fafaf9; border-color: #e7e5e4; padding: 20px;">
    <p style="font-size: 10pt; color: #292524; line-height: 1.6; margin-bottom: 14px;">
      La plataforma <strong>INVESTMENTS</strong> no es solo una página web; es un <strong>activo comercial integral</strong> que automatiza sus ventas, profesionaliza la atención a clientes mayoristas, reduce costos operativos de atención manual y le permite vender las 24 horas del día, los 365 días del año en todo el territorio peruano.
    </p>
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 15px; border-top: 1px solid #e7e5e4; padding-top: 15px; text-align: center;">
      <div>
        <strong style="display: block; font-size: 14pt; color: #d97706;">24/7</strong>
        <span style="font-size: 7.5pt; color: #78716c; text-transform: uppercase;">Ventas Continuas</span>
      </div>
      <div>
        <strong style="display: block; font-size: 14pt; color: #0f172a;">100%</strong>
        <span style="font-size: 7.5pt; color: #78716c; text-transform: uppercase;">Control de Stock</span>
      </div>
      <div>
        <strong style="display: block; font-size: 14pt; color: #15803d;">0%</strong>
        <span style="font-size: 7.5pt; color: #78716c; text-transform: uppercase;">Comisiones Ocultas</span>
      </div>
      <div>
        <strong style="display: block; font-size: 14pt; color: #0284c7;">Nacional</strong>
        <span style="font-size: 7.5pt; color: #78716c; text-transform: uppercase;">Cobertura Perú</span>
      </div>
    </div>
  </div>

  <div style="margin-top: 30px; padding: 20px; background: #0f172a; color: #ffffff; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;" class="avoid-break">
    <div>
      <h3 style="font-size: 12pt; color: #fbbf24; margin-bottom: 4px;">INVESTMENTS — Su Marca al Siguiente Nivel</h3>
      <p style="font-size: 8.5pt; color: #cbd5e1;">Plataforma desarrollada y auditada con éxito bajo estándares internacionales de ingeniería de software.</p>
    </div>
    <div style="text-align: right;">
      <span style="display: block; font-size: 9pt; font-weight: 700; color: #ffffff;">OCTUBRE 2026</span>
      <span style="font-size: 8pt; color: #94a3b8;">Documento Oficial de Entrega</span>
    </div>
  </div>

  <div class="footer-note">
    <span>INVESTMENTS S.A.C. — Confidencial para el Cliente</span>
    <span>Dossier Comercial • Página 5</span>
  </div>

</body>
</html>
`;

async function generatePDF() {
  console.log("Iniciando generación del Dossier Ejecutivo en PDF...");

  // Guardar copia HTML para visualización directa en navegador
  const htmlPath = resolve("public", "INVESTMENTS_Dossier_Ejecutivo_Ecommerce.html");
  writeFileSync(htmlPath, htmlContent, "utf-8");
  console.log(`Copia HTML guardada en: ${htmlPath}`);

  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle" });

  const pdfPath = resolve("INVESTMENTS_Dossier_Ejecutivo_Ecommerce.pdf");
  const publicPdfPath = resolve("public", "INVESTMENTS_Dossier_Ejecutivo_Ecommerce.pdf");

  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: {
      top: "0mm",
      bottom: "0mm",
      left: "0mm",
      right: "0mm",
    },
  });

  // Copia también a la carpeta public para descarga directa desde web
  writeFileSync(publicPdfPath, await page.pdf({ format: "A4", printBackground: true }));

  await browser.close();

  console.log(`✅ ¡PDF ESPECTACULAR GENERADO EXITOSAMENTE!`);
  console.log(`📁 Ubicación raíz: ${pdfPath}`);
  console.log(`📁 Ubicación pública web: ${publicPdfPath}`);
}

generatePDF().catch(console.error);

