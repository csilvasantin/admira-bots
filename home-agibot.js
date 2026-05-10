function installAdmiraBackdrop() {
  if (document.querySelector(".admira-wallpaper")) return;

  const style = document.createElement("style");
  style.textContent = `
    body { background: #070914; }
    .admira-wallpaper {
      position: fixed;
      inset: 0;
      z-index: -3;
      overflow: hidden;
      background: #070914;
    }
    .admira-wallpaper img,
    .admira-wallpaper video {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center top;
    }
    .admira-wallpaper img {
      filter: blur(2px);
      transform: scale(1.03);
    }
    .admira-wallpaper video {
      opacity: 0.72;
      filter: saturate(1.18) contrast(1.05);
    }
    .admira-wallpaper::after {
      content: "";
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at center, rgba(10, 12, 28, 0.08), rgba(5, 7, 16, 0.72) 72%),
        linear-gradient(90deg, rgba(5, 7, 16, 0.18), rgba(5, 7, 16, 0.82) 28%, rgba(5, 7, 16, 0.82) 72%, rgba(5, 7, 16, 0.18));
    }
    .site-shell {
      width: min(1180px, calc(100% - 48px));
      margin: 24px auto;
      overflow: clip;
      border: 2px solid rgba(145, 155, 184, 0.62);
      border-radius: 12px;
      background: rgba(7, 9, 20, 0.86);
      box-shadow:
        0 0 0 1px rgba(69, 243, 255, 0.18),
        0 26px 80px rgba(0, 0, 0, 0.68),
        0 0 50px rgba(255, 79, 243, 0.13);
      backdrop-filter: blur(4px);
    }
    .site-shell .site-header { top: 24px; }
    .site-shell .hero { min-height: calc(100vh - 126px); }
    @media (max-width: 680px) {
      .site-shell {
        width: 100%;
        margin: 0;
        border-width: 0;
        border-radius: 0;
      }
      .site-shell .site-header { top: 0; }
    }
  `;
  document.head.appendChild(style);

  const wallpaper = document.createElement("div");
  wallpaper.className = "admira-wallpaper";
  wallpaper.setAttribute("aria-hidden", "true");
  wallpaper.innerHTML = `
    <img src="https://www.admiranext.com/assets/robots.jpg" alt="">
    <video muted loop autoplay playsinline preload="auto" poster="https://www.admiranext.com/assets/robots.jpg">
      <source src="https://www.admiranext.com/assets/fondoAdmiraNext.mp4" type="video/mp4">
    </video>
  `;
  document.body.prepend(wallpaper);

  const shell = document.createElement("div");
  shell.className = "site-shell";
  const script = document.currentScript;
  [...document.body.children]
    .filter((child) => child !== wallpaper && child !== script && !child.classList.contains("site-shell"))
    .forEach((child) => shell.appendChild(child));
  document.body.insertBefore(shell, script);
}

installAdmiraBackdrop();

const translations = {
  es: {
    pageTitle: "Admira.shop | Venta y alquiler de robots Agibot en España",
    pageDescription:
      "Venta, alquiler y activación de robots Agibot con Admira.shop para eventos, retail, educación, inspección y empresas en España.",
    navLabel: "Principal",
    navRobots: "Robots",
    navPlans: "Compra / alquiler",
    navProcess: "Proceso",
    navContact: "Contacto",
    headerCta: "Consultar",
    heroEyebrow: "Robots Agibot en España",
    heroTitle: "Compra o alquila robots Agibot para activar tu marca.",
    heroText:
      "En AdmiraNext creamos experiencias innovadoras combinando creatividad y tecnología. Admira.shop conecta la venta, el alquiler y la puesta en escena de robots Agibot para eventos, retail, educación, inspección y empresas.",
    heroPrimary: "Pedir propuesta",
    heroSecondary: "Ver Agibot",
    availabilityLabel: "Resumen de servicio",
    availabilityDeliveryTitle: "Venta + RaaS",
    availabilityDeliveryText: "Compra directa o alquiler flexible",
    availabilityOperatorTitle: "Soporte local",
    availabilityOperatorText: "Briefing, entrega, operador y puesta en marcha",
    availabilityBrandingTitle: "Experiencia a medida",
    availabilityBrandingText: "Guiones, demo, pantallas y flujos de marca",
    metricEventsTitle: "Alquiler",
    metricEventsText: "Desde demos de un día hasta campañas itinerantes.",
    metricRetailTitle: "Venta",
    metricRetailText: "Compra de unidades Agibot con acompañamiento de implantación.",
    metricCompanyTitle: "Integración",
    metricCompanyText: "Contenidos, guiones, formación y soporte para equipos.",
    catalogEyebrow: "Catálogo Agibot",
    catalogTitle: "Elige el formato Agibot según el uso: evento, operación o laboratorio.",
    hostTitle: "Agibot A2 / X2 humanoide",
    hostText: "Para recepción, guía de visitantes, showroom, entretenimiento, educación y demostraciones de IA embodied.",
    hostItem1: "Interacción multimodal y presencia escénica",
    hostItem2: "Compra o alquiler para eventos",
    hostItem3: "Ideal para ferias, retail y educación",
    waiterTitle: "Agibot D1 cuadrúpedo",
    waiterText: "Robot ágil para demostraciones, educación, patrulla ligera, inspección visual y acciones de alto impacto.",
    waiterItem1: "Formato demostración o desarrollo",
    waiterItem2: "Control remoto y rutas supervisadas",
    waiterItem3: "Perfecto para campus, stands y seguridad",
    showTitle: "Agibot C5 / soluciones",
    showText: "Soluciones comerciales para limpieza, operaciones y pilotos de automatización con acompañamiento técnico.",
    showItem1: "Pilotos para centros comerciales y empresas",
    showItem2: "Configuración según escenario",
    showItem3: "Escalable a compra, renting o servicio",
    plansEyebrow: "Compra y alquiler",
    plansTitle: "Conecta con Agibot desde una demo rápida hasta una implantación completa.",
    demoTime: "1 jornada",
    demoTitle: "Alquiler evento",
    demoText: "Robot Agibot para ferias, presentaciones, visitas VIP o pruebas de concepto internas.",
    demoPrice: "Desde 899 EUR",
    eventTime: "Compra directa",
    eventTitle: "Venta Agibot",
    eventText: "Selección de modelo, pedido, logística, formación y arranque operativo con soporte Admira.",
    eventPrice: "A consultar",
    campaignTime: "Varios días / meses",
    campaignTitle: "RaaS / renting",
    campaignText: "Modelo flexible para campañas, centros comerciales, educación, demos recurrentes o validación operativa.",
    campaignPrice: "A medida",
    plansNote: "Agibot anunció alquiler flexible desde 899 EUR/día y tienda global oficial. Admira.shop actúa como punto de conexión, activación y soporte para España.",
    processEyebrow: "Cómo trabajamos",
    processTitle: "Nos ocupamos del encaje comercial y técnico para que Agibot funcione como parte de tu marca.",
    briefTitle: "Caso de uso",
    briefText: "Definimos objetivo, espacio, público, horarios, presupuesto y si conviene comprar, alquilar o hacer piloto.",
    setupTitle: "Conexión Agibot",
    setupText: "Validamos modelo, disponibilidad, accesorios, logística, requisitos técnicos y soporte local.",
    activationTitle: "Entrega y activación",
    activationText: "Instalamos, formamos, operamos si hace falta y ajustamos la experiencia durante el servicio.",
    contactEyebrow: "Conectar Agibot",
    contactTitle: "Cuéntanos si quieres comprar, alquilar o probar un robot Agibot.",
    contactText:
      "Indica ciudad, fecha, modelo o uso previsto, duración y objetivo. Te responderemos con recomendación, disponibilidad y siguiente paso con Agibot.",
    formName: "Nombre",
    formEmail: "Email",
    formDateCity: "Fecha y ciudad",
    formDateCityPlaceholder: "Ej. Madrid, 18 de junio",
    formRobot: "Qué necesitas",
    formRobotHost: "Comprar Agibot humanoide",
    formRobotWaiter: "Alquilar Agibot para evento",
    formRobotShow: "Piloto / RaaS empresarial",
    formRobotD1: "Robot cuadrúpedo D1",
    formRobotUnsure: "No lo tengo claro",
    formMessage: "Mensaje",
    formMessagePlaceholder: "Objetivo, modelo Agibot si lo conoces, duración, espacio y presupuesto orientativo",
    formSubmit: "Conectar con Agibot",
  },
  en: {
    pageTitle: "Admira.shop | Agibot robot sales and rental in Spain",
    pageDescription:
      "Agibot robot sales, rental and activation with Admira.shop for events, retail, education, inspection and companies in Spain.",
    navLabel: "Main",
    navRobots: "Robots",
    navPlans: "Buy / rent",
    navProcess: "Process",
    navContact: "Contact",
    headerCta: "Ask",
    heroEyebrow: "Agibot robots in Spain",
    heroTitle: "Buy or rent Agibot robots to activate your brand.",
    heroText:
      "At AdmiraNext we create innovative experiences by combining creativity and technology. Admira.shop connects Agibot robot sales, rental and staging for events, retail, education, inspection and companies.",
    heroPrimary: "Request proposal",
    heroSecondary: "View Agibot",
    availabilityLabel: "Service summary",
    availabilityDeliveryTitle: "Sales + RaaS",
    availabilityDeliveryText: "Direct purchase or flexible rental",
    availabilityOperatorTitle: "Local support",
    availabilityOperatorText: "Briefing, delivery, operator and launch",
    availabilityBrandingTitle: "Custom experience",
    availabilityBrandingText: "Scripts, demo, screens and brand flows",
    metricEventsTitle: "Rental",
    metricEventsText: "From one-day demos to touring campaigns.",
    metricRetailTitle: "Sales",
    metricRetailText: "Purchase Agibot units with rollout support.",
    metricCompanyTitle: "Integration",
    metricCompanyText: "Content, scripts, training and support for teams.",
    catalogEyebrow: "Agibot catalog",
    catalogTitle: "Choose the Agibot format by use case: event, operation or lab.",
    hostTitle: "Agibot A2 / X2 humanoid",
    hostText: "For reception, visitor guidance, showrooms, entertainment, education and embodied AI demos.",
    hostItem1: "Multimodal interaction and stage presence",
    hostItem2: "Purchase or event rental",
    hostItem3: "Ideal for trade shows, retail and education",
    waiterTitle: "Agibot D1 quadruped",
    waiterText: "Agile robot for demos, education, light patrol, visual inspection and high-impact actions.",
    waiterItem1: "Demo or development format",
    waiterItem2: "Remote control and supervised routes",
    waiterItem3: "Perfect for campuses, stands and security",
    showTitle: "Agibot C5 / solutions",
    showText: "Commercial solutions for cleaning, operations and automation pilots with technical support.",
    showItem1: "Pilots for malls and companies",
    showItem2: "Configuration by scenario",
    showItem3: "Scales to purchase, rental or service",
    plansEyebrow: "Buy and rent",
    plansTitle: "Connect with Agibot from a quick demo to a complete rollout.",
    demoTime: "1 day",
    demoTitle: "Event rental",
    demoText: "Agibot robot for trade shows, presentations, VIP visits or internal proof-of-concept sessions.",
    demoPrice: "From EUR 899",
    eventTime: "Direct purchase",
    eventTitle: "Agibot sales",
    eventText: "Model selection, order, logistics, training and operational launch with Admira support.",
    eventPrice: "On request",
    campaignTime: "Days / months",
    campaignTitle: "RaaS / leasing",
    campaignText: "Flexible model for campaigns, malls, education, recurring demos or operational validation.",
    campaignPrice: "Custom",
    plansNote: "Agibot announced flexible rental from EUR 899/day and a global official store. Admira.shop acts as a connection, activation and support point for Spain.",
    processEyebrow: "How we work",
    processTitle: "We handle the commercial and technical fit so Agibot works as part of your brand.",
    briefTitle: "Use case",
    briefText: "We define the goal, space, audience, schedule, budget and whether buying, renting or piloting fits best.",
    setupTitle: "Agibot connection",
    setupText: "We validate model, availability, accessories, logistics, technical requirements and local support.",
    activationTitle: "Delivery and activation",
    activationText: "We install, train, operate if needed and adjust the experience during the service.",
    contactEyebrow: "Connect Agibot",
    contactTitle: "Tell us whether you want to buy, rent or test an Agibot robot.",
    contactText:
      "Share the city, date, model or use case, duration and goal. We will reply with a recommendation, availability and the next step with Agibot.",
    formName: "Name",
    formEmail: "Email",
    formDateCity: "Date and city",
    formDateCityPlaceholder: "E.g. Madrid, June 18",
    formRobot: "What do you need",
    formRobotHost: "Buy Agibot humanoid",
    formRobotWaiter: "Rent Agibot for event",
    formRobotShow: "Business pilot / RaaS",
    formRobotD1: "D1 quadruped robot",
    formRobotUnsure: "Not sure yet",
    formMessage: "Message",
    formMessagePlaceholder: "Goal, Agibot model if known, duration, space and estimated budget",
    formSubmit: "Connect with Agibot",
  },
};

const languageToggle = document.querySelector(".language-toggle");
const metaDescription = document.querySelector('meta[name="description"]');

function applyLanguage(language) {
  const dictionary = translations[language] ?? translations.es;

  document.documentElement.lang = language;
  document.title = dictionary.pageTitle;
  metaDescription?.setAttribute("content", dictionary.pageDescription);

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (dictionary[key]) {
      element.textContent = dictionary[key];
    }
  });

  document.querySelectorAll("[data-i18n-attr]").forEach((element) => {
    element.dataset.i18nAttr.split(",").forEach((pair) => {
      const [attribute, key] = pair.split(":");
      if (attribute && key && dictionary[key]) {
        element.setAttribute(attribute, dictionary[key]);
      }
    });
  });

  localStorage.setItem("admiraShopLanguage", language);

  if (languageToggle) {
    const isSpanish = language === "es";
    languageToggle.textContent = isSpanish ? "ENG" : "ES";
    languageToggle.setAttribute("aria-label", isSpanish ? "Switch to English" : "Cambiar a castellano");
  }
}

const savedLanguage = localStorage.getItem("admiraShopLanguage");
const initialLanguage = savedLanguage && translations[savedLanguage] ? savedLanguage : "es";

if (languageToggle) {
  languageToggle.addEventListener("click", () => {
    const currentLanguage = document.documentElement.lang === "en" ? "en" : "es";
    applyLanguage(currentLanguage === "es" ? "en" : "es");
  });
}

applyLanguage(initialLanguage);
